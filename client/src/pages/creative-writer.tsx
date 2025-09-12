"use client";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Sparkles, Feather, BookOpen, FileText, Zap } from "lucide-react";
import { useQuestionLimit } from "@/hooks/use-question-limit";
import { StandardHeader, StandardFooter } from "@/components/StandardHeader";
import { fetchJSON, FetchError } from "@/lib/fetchJSON";

interface CreativeWriterResult {
  content: string;
  mode: string;
  word_count_target: number;
  max_words: number;
  style_dials: {
    mood: string;
    intensity: number;
    edge: number;
    gothic_flourish: boolean;
    carebear_to_policehorse: number;
  };
  auto_selected?: boolean;
  routing?: {
    style: string;
    genre: string;
    pov: string;
    tense: string;
    target_words: number;
  };
  usage?: {
    tokens: number;
    words: number;
    target_words: number;
    completion_status: string;
    finish_reason: string;
  };
  completion_status?: string;
}

export default function CreativeWriterPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreativeWriterResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { questionLimit, refreshQuestionLimit, quotaError, setQuestionLimit } = useQuestionLimit();

  // Refresh question limit on component mount (non-blocking)
  useEffect(() => {
    refreshQuestionLimit(1); // Using default user ID 1
  }, []); // Empty dependency array to prevent infinite loop

  // Auto-Selection Routing Functions (moved up to avoid TDZ)
  const autoSelectCreative = (prompt: string, manualStyle?: string, manualGenre?: string, manualPOV?: string, lengthHint?: number) => {
    const lower = prompt.toLowerCase();
    
    // 1) Form Detection
    let style = "short_story"; // default
    if (manualStyle) {
      style = manualStyle;
    } else {
      if (/\bpoem|verse|sonnet\b/.test(lower)) style = "poem";
      else if (/\bscreenplay|script|slugline\b/.test(lower)) style = "screenplay";
      else if (/\bmonologue|speech|soliloquy\b/.test(lower)) style = "monologue";
      else if (/\bessay|article|op-ed|op ed|opinion\b/.test(lower)) style = "article";
      else if (/\bchapter|opening scene|pilot\b/.test(lower)) style = "chapter";
      else if (/\bmicro|very short|100-300 words\b/.test(lower)) style = "microfiction";
    }

    // 2) Genre Detection
    const genreMap: [string, RegExp][] = [
      ["fantasy", /\b(crown|kingdom|dragon|sorcer|prophe|knight|castle)\b/],
      ["sci_fi", /\b(ship|orbit|ai|android|quantum|colony|station|neural)\b/],
      ["horror", /\b(crypt|apparit|haunt|ritual|blood|possession|eldritch)\b/],
      ["thriller", /\b(stakeout|heist|fixer|cartel|spy|chase|assassin)\b/],
      ["romance", /\b(lover|kiss|heartbreak|confession|chemistry)\b/],
      ["historical", /\b(regency|dynasty|trench|victorian|roman|192\d|18\d\d)\b/],
      ["humor", /\b(parody|satire|sketch|bit|roast|absurd)\b/],
      ["contemporary", /\b(apartment|therapy|bartender|rideshare|startup|roommate)\b/],
    ];
    
    let genre = "other";
    if (manualGenre) {
      genre = manualGenre;
    } else {
      for (const [g, rx] of genreMap) {
        if (rx.test(lower)) {
          genre = g;
          break;
        }
      }
    }

    // 3) POV Detection
    let pov = "first_close"; // default
    if (manualPOV) {
      pov = manualPOV;
    } else {
      if (/you\b/.test(lower) && /imperative|instructions|address/.test(lower)) {
        pov = "second";
      } else if (["article", "screenplay"].includes(style)) {
        pov = style === "screenplay" ? "screenplay" : "third_omniscient";
      }
    }

    // 4) Tense Detection
    const tense = /now|tonight|as it happens|live/.test(lower) ? "present" : "past";

    // 5) Target Words
    let target_words = lengthHint || 
      (style === "chapter" ? 1100 :
       style === "short_story" ? 1000 :
       style === "microfiction" ? 220 :
       style === "poem" ? 0 : // line-based
       style === "monologue" ? 700 :
       style === "screenplay" ? 600 : // ~1–2 pages worth of action/dialog
       900);

    return { style, genre, pov, tense, target_words };
  };

  // Form state
  const [mode, setMode] = useState("fiction_chapter");
  const [topicOrPremise, setTopicOrPremise] = useState("");
  const [audience, setAudience] = useState("");
  const [wordCountTarget, setWordCountTarget] = useState(1000);
  const [maxWords, setMaxWords] = useState(1200);
  const [structure, setStructure] = useState("");
  const [extras, setExtras] = useState("");
  
  // Style dials
  const [mood, setMood] = useState("gritty");
  const [intensity, setIntensity] = useState([3]);
  const [edge, setEdge] = useState([3]);
  const [gothicFlourish, setGothicFlourish] = useState(false);
  const [carebearToPolicehorse, setCarebearToPolicehorse] = useState([5]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);

  // Debug form state changes
  useEffect(() => {
    console.log('Form state updated:', {
      topicOrPremise,
      audience,
      mode,
      wordCountTarget,
      maxWords,
      activePreset
    });
  }, [topicOrPremise, audience, mode, wordCountTarget, maxWords, activePreset]);

  async function handleResume() {
    if (!result?.content || result.completion_status !== "truncated") {
      return;
    }
    
    setLoading(true);
    setIsSubmitting(true);
    setErr(null);
    
    try {
      // Get the last 100 words as context
      const words = result.content.trim().split(/\s+/);
      const contextWords = words.slice(-100).join(' ');
      
      const data = await fetchJSON("/api/creative-writer/resume", {
        method: "POST",
        body: JSON.stringify({
          mode: result.mode,
          context: contextWords,
          target_words: result.word_count_target,
          current_words: words.length,
          userId: 1
        }),
      });
      
      // Append the resumed content
      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          content: prev.content + " " + data.text,
          completion_status: "completed",
          usage: {
            tokens: (prev.usage?.tokens || 0) + (data.usage?.tokens || 0),
            words: (prev.usage?.words || 0) + (data.usage?.words || 0),
            target_words: prev.usage?.target_words || prev.word_count_target,
            completion_status: "completed",
            finish_reason: "completed"
          }
        };
      });
      
    } catch (error) {
      if (error instanceof FetchError) {
        setErr(error.message);
      } else {
        setErr("Failed to resume content. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }

  async function handleGenerate() {
    // Prevent multiple rapid clicks
    if (isSubmitting || loading) {
      return;
    }
    
    setErr(null);
    if (!topicOrPremise.trim() || !audience.trim()) { 
      setErr("Please provide both a topic/premise and target audience."); 
      return; 
    }
    
    setLoading(true);
    setIsSubmitting(true);
    setRateLimited(false);
    
    try {
      // Get auto-selection routing if enabled
      let routingData = {};
      if (autoSelect) {
        const routing = autoSelectCreative(topicOrPremise, mode, undefined, undefined, wordCountTarget);
        routingData = {
          auto_selected: true,
          routing: routing
        };
      }

      const data = await fetchJSON("/api/creative-writer", {
        method: "POST",
        body: JSON.stringify({ 
          mode,
          topic_or_premise: topicOrPremise,
          audience,
          word_count_target: wordCountTarget,
          max_words: maxWords,
          structure,
          extras,
          mood,
          intensity: intensity[0],
          edge: edge[0],
          gothic_flourish: gothicFlourish,
          carebear_to_policehorse: carebearToPolicehorse[0],
          userId: 1,
          ...routingData
        }),
      });
      
      // Update result with new API response format
      setResult({
        content: data.text,
        mode,
        word_count_target: wordCountTarget,
        max_words: maxWords,
        style_dials: {
          mood,
          intensity: intensity[0],
          edge: edge[0],
          gothic_flourish: gothicFlourish,
          carebear_to_policehorse: carebearToPolicehorse[0]
        },
        auto_selected: data.personaResolved ? true : false,
        routing: data.personaResolved,
        usage: data.usage || {},
        completion_status: data.usage?.completion_status || "complete"
      });
      
      // Update question limit from response data (no need to refetch)
      if (data.remaining !== undefined && data.limit !== undefined) {
        setQuestionLimit({
          remaining: data.remaining,
          limit: data.limit,
          canAsk: data.remaining > 0
        });
      }
    } catch (error) {
      if (error instanceof FetchError) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
          setErr("You're out of free responses. Upgrade to continue.");
          setRateLimited(true);
        } else if (error.status === 402) {
          setErr("You're out of free responses. Upgrade to continue.");
          setRateLimited(true);
        } else if (error.status === 429) {
          setErr("Too many requests. Try again in ~30s.");
        } else if (error.status === 401 || error.status === 403) {
          setErr("Please sign in again.");
        } else if (error.status >= 500) {
          setErr("Service hiccup. Retrying...");
        } else {
          setErr(error.message);
        }
      } else if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_')) {
          setErr("Network error. Check your connection and try again.");
        } else {
          setErr(error.message);
        }
      } else {
        setErr("Failed to generate content. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Count words in text
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to create tooltip button
  const createTooltipButton = (tooltipId: string, ariaLabel: string, content: string) => (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-describedby={`tt-${tooltipId}`}
      className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      onFocus={() => setActiveTooltip(tooltipId)}
      onBlur={() => setActiveTooltip(null)}
      onMouseEnter={() => setActiveTooltip(tooltipId)}
      onMouseLeave={() => setActiveTooltip(null)}
      onClick={() => setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId)}
    >
      ?
      {activeTooltip === tooltipId && (
        <div
          id={`tt-${tooltipId}`}
          role="tooltip"
          className="absolute left-1/2 z-50 mt-2 w-64 -translate-x-1/2 rounded-md border border-red-900/30 bg-red-900/95 p-2 text-xs text-white shadow-lg pointer-events-none"
        >
          {content}
        </div>
      )}
    </button>
  );

  // Clear all form fields
  const clearAllFields = () => {
    setTopicOrPremise('');
    setAudience('');
    setStructure('');
    setExtras('');
    setResult(null);
    setErr(null);
    setActivePreset(null);
  };

  // Content Type selection (only changes mode)
  const applyContentType = (contentType: string) => {
    console.log('Applying content type:', contentType);
    setMode(contentType);
    setActivePreset(null); // Clear quick preset selection
    setErr(`✅ Selected content type: ${contentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    setTimeout(() => setErr(null), 2000);
  };

  // Quick Presets (populate content details, keep current content type)
  const applyQuickPreset = (presetType: string) => {
    console.log('Applying quick preset:', presetType);
    
    // Clear content fields but keep the current content type
    setTopicOrPremise('');
    setAudience('');
    setStructure('');
    setExtras('');
    setResult(null);
    setErr(null);
    
    switch (presetType) {
      case 'fantasy_romance':
        setWordCountTarget(1000);
        setMaxWords(1200);
        setMood('cinematic');
        setIntensity([4]);
        setEdge([2]);
        setGothicFlourish(true);
        setCarebearToPolicehorse([3]);
        console.log('Applied Fantasy Romance preset');
        break;
      case 'marketing_article':
        setWordCountTarget(500);
        setMaxWords(550);
        setMood('journalistic');
        setIntensity([3]);
        setEdge([3]);
        setGothicFlourish(false);
        setCarebearToPolicehorse([4]);
        console.log('Applied Marketing Article preset');
        break;
      case 'mystery_thriller':
        setWordCountTarget(800);
        setMaxWords(900);
        setMood('gritty');
        setIntensity([4]);
        setEdge([4]);
        setGothicFlourish(true);
        setCarebearToPolicehorse([6]);
        console.log('Applied Mystery Thriller preset');
        break;
      case 'comedy_sketch':
        setWordCountTarget(300);
        setMaxWords(400);
        setMood('wry');
        setIntensity([4]);
        setEdge([5]);
        setGothicFlourish(false);
        setCarebearToPolicehorse([7]);
        console.log('Applied Comedy Sketch preset');
        break;
    }
    
    // Set active preset and show success feedback
    setActivePreset(presetType);
    setErr(`✅ Applied quick preset: ${presetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    setTimeout(() => setErr(null), 3000);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'fiction_chapter': return <BookOpen className="h-5 w-5" />;
      case 'fiction_outline': return <FileText className="h-5 w-5" />;
      case 'article': return <Feather className="h-5 w-5" />;
      case 'teaser_blurbs': return <Zap className="h-5 w-5" />;
      default: return <Feather className="h-5 w-5" />;
    }
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'fiction_chapter': return 'Chapter prose with optional title and scene beats';
      case 'fiction_outline': return 'Chapter list with 2-3 sentence summaries each';
      case 'article': return 'Publish-ready essay/guide in MoodyBot voice';
      case 'teaser_blurbs': return '3-5 loglines or hooks from the same premise';
      default: return '';
    }
  };

  const getMoodPreview = (mood: string) => {
    switch (mood) {
      case 'gritty': return 'Raw, visceral prose with hard edges and authentic voice';
      case 'romantic': return 'Emotional, lyrical writing with heart and vulnerability';
      case 'wry': return 'Clever, ironic tone with subtle humor and wit';
      case 'journalistic': return 'Clear, factual style with sharp observations';
      case 'cinematic': return 'Visual, scene-setting prose that paints pictures';
      default: return '';
    }
  };

  const getIntensityPreview = (level: number) => {
    switch (level) {
      case 1: return 'Gentle, flowing sentences with soft rhythm';
      case 2: return 'Moderate pace with balanced structure';
      case 3: return 'Dynamic writing with varied sentence lengths';
      case 4: return 'Intense, compressed prose with vivid imagery';
      case 5: return 'Maximum intensity with rapid-fire, visceral language';
      default: return '';
    }
  };

  const getEdgePreview = (level: number) => {
    switch (level) {
      case 1: return 'Safe, professional tone suitable for all audiences';
      case 2: return 'Mildly provocative with subtle attitude';
      case 3: return 'Moderate edge with some bite and personality';
      case 4: return 'Sharp, edgy writing with real attitude';
      case 5: return 'Maximum edge with unfiltered, raw voice';
      default: return '';
    }
  };

  const getCarebearPreview = (level: number) => {
    if (level <= 2) return 'Gentle, supportive, encouraging tone';
    if (level <= 4) return 'Balanced approach with some directness';
    if (level <= 6) return 'Direct, honest feedback with some warmth';
    if (level <= 8) return 'Blunt, no-nonsense approach';
    return 'Brutally honest, unflinching truth-telling';
  };

  const getModeActionText = (mode: string) => {
    switch (mode) {
      case 'fiction_chapter': return 'Write Chapter';
      case 'fiction_outline': return 'Draft Outline';
      case 'article': return 'Craft Article';
      case 'teaser_blurbs': return 'Create Blurbs';
      default: return 'Generate Content';
    }
  };

  const getRecommendedPersona = (topic: string, audience: string) => {
    const topicLower = topic.toLowerCase();
    const audienceLower = audience.toLowerCase();
    
    // Fantasy/Romance detection
    if (topicLower.includes('fantasy') || topicLower.includes('princess') || topicLower.includes('magic') || 
        audienceLower.includes('fantasy') || audienceLower.includes('romance')) {
      return 'Gothic Flourish + Cinematic (Perfect for fantasy romance with atmospheric worldbuilding)';
    }
    
    // Marketing/Business detection
    if (topicLower.includes('marketing') || topicLower.includes('business') || topicLower.includes('product') ||
        audienceLower.includes('marketer') || audienceLower.includes('business') || audienceLower.includes('entrepreneur')) {
      return 'Ogilvy Copywriter + Journalistic (Clear, persuasive marketing voice)';
    }
    
    // Mystery/Thriller detection
    if (topicLower.includes('mystery') || topicLower.includes('detective') || topicLower.includes('crime') ||
        audienceLower.includes('mystery') || audienceLower.includes('thriller')) {
      return 'Forensic Files + Wry (Cold psychological narration with subtle wit)';
    }
    
    // Comedy/Satire detection
    if (topicLower.includes('comedy') || topicLower.includes('funny') || topicLower.includes('satire') ||
        audienceLower.includes('comedy') || audienceLower.includes('humor')) {
      return 'Savage Roast + Wry (Biting humor with sharp wit)';
    }
    
    // Default recommendation
    return 'MoodyBot Default + Gritty (Bourdain/Hank Moody mix for authentic voice)';
  };

  const applyRecommendedSettings = (topic: string, audience: string) => {
    const topicLower = topic.toLowerCase();
    const audienceLower = audience.toLowerCase();
    
    // Fantasy/Romance settings
    if (topicLower.includes('fantasy') || topicLower.includes('princess') || topicLower.includes('magic') || 
        audienceLower.includes('fantasy') || audienceLower.includes('romance')) {
      setMood('cinematic');
      setIntensity([4]);
      setEdge([2]);
      setGothicFlourish(true);
      setCarebearToPolicehorse([3]);
    }
    // Marketing/Business settings
    else if (topicLower.includes('marketing') || topicLower.includes('business') || topicLower.includes('product') ||
             audienceLower.includes('marketer') || audienceLower.includes('business') || audienceLower.includes('entrepreneur')) {
      setMood('journalistic');
      setIntensity([3]);
      setEdge([2]);
      setGothicFlourish(false);
      setCarebearToPolicehorse([4]);
    }
    // Mystery/Thriller settings
    else if (topicLower.includes('mystery') || topicLower.includes('detective') || topicLower.includes('crime') ||
             audienceLower.includes('mystery') || audienceLower.includes('thriller')) {
      setMood('wry');
      setIntensity([3]);
      setEdge([3]);
      setGothicFlourish(false);
      setCarebearToPolicehorse([5]);
    }
    // Comedy/Satire settings
    else if (topicLower.includes('comedy') || topicLower.includes('funny') || topicLower.includes('satire') ||
             audienceLower.includes('comedy') || audienceLower.includes('humor')) {
      setMood('wry');
      setIntensity([4]);
      setEdge([4]);
      setGothicFlourish(false);
      setCarebearToPolicehorse([7]);
    }
    // Default settings
    else {
      setMood('gritty');
      setIntensity([3]);
      setEdge([3]);
      setGothicFlourish(false);
      setCarebearToPolicehorse([5]);
    }
  };

  // Auto-Selection Routing Functions

  const getAutoSelectDisplay = (prompt: string) => {
    const routing = autoSelectCreative(prompt);
    return `${routing.style} • ${routing.genre} • ${routing.pov} • ${routing.tense} • ~${routing.target_words} words`;
  };

  // Persona recommendation function
  const recommendPersona = (input: {
    contentMode: string;
    audience: string;
    topic: string;
  }) => {
    const t = `${input.topic} ${input.audience}`.toLowerCase();
    
    if (input.contentMode === 'article') {
      return { persona: 'ogilvy', intensity: 0.35, edge: 0.2 };
    }
    if (t.match(/fantasy|princess|crow|myth|gothic/)) {
      return { persona: 'gothic_flourish', intensity: 0.45, edge: 0.35 };
    }
    if (t.match(/crime|forensic|case|evidence/)) {
      return { persona: 'forensic_files', intensity: 0.3, edge: 0.4 };
    }
    if (t.match(/roast|rant|satire|expose/)) {
      return { persona: 'savage_roast', intensity: 0.5, edge: 0.7 };
    }
    return { persona: 'moodybot_default', intensity: 0.4, edge: 0.4 };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-red-900/5 to-amber-900/5 text-foreground relative">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(127,29,29,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(146,64,14,0.03),transparent_50%)] pointer-events-none" />
      {/* Standard Header */}
      <StandardHeader modeName="Creative Writer Mode" />

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-red-700 to-amber-500 bg-clip-text text-transparent">
            Creative Writer Mode
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Dive-bar oracle meets copywriter: Hank Moody swagger + Anthony Bourdain grit
          </p>
          <p className="text-sm text-muted-foreground">
            Fiction • Articles • Outlines • Teaser Blurbs
          </p>
        </div>

        {/* Auto-MoodyBot Mode Toggle */}
        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-900/30 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual-mode"
                  name="mode-toggle"
                  checked={!autoSelect}
                  onChange={() => setAutoSelect(false)}
                  className="w-4 h-4 text-indigo-600"
                />
                <Label htmlFor="manual-mode" className="text-sm font-medium cursor-pointer">
                  🔘 Manual Mode
                </Label>
                <span className="text-xs text-muted-foreground">(user sets everything)</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="auto-mode"
                  name="mode-toggle"
                  checked={autoSelect}
                  onChange={() => setAutoSelect(true)}
                  className="w-4 h-4 text-indigo-600"
                />
                <Label htmlFor="auto-mode" className="text-sm font-medium cursor-pointer">
                  🔘 MoodyBot Auto
                </Label>
                <span className="text-xs text-muted-foreground">(system selects persona + style)</span>
              </div>
            </div>
            {autoSelect && topicOrPremise && audience && (
              <div className="mt-4 text-center">
                <div className="text-xs text-indigo-300 bg-indigo-900/20 px-3 py-2 rounded-lg inline-block">
                  {getAutoSelectDisplay(topicOrPremise)}
                </div>
                <div className="mt-2">
                  {(() => {
                    const recommendation = recommendPersona({
                      contentMode: mode,
                      audience: audience,
                      topic: topicOrPremise
                    });
                    return (
                      <div className="text-xs text-amber-300 bg-amber-900/20 px-3 py-2 rounded-lg inline-block">
                        Recommended: {recommendation.persona} • Intensity {Math.round(recommendation.intensity * 5)}/5 • Edge {Math.round(recommendation.edge * 5)}/5
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Limit Display */}
        <Card className="mb-4 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                {questionLimit ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {questionLimit.remaining > 0 
                        ? `${questionLimit.remaining} free creative writing request${questionLimit.remaining === 1 ? '' : 's'} remaining`
                        : 'No free creative writing requests remaining'
                      }
                    </p>
                    {questionLimit.remaining <= 1 && questionLimit.remaining > 0 && (
                      <p className="text-xs text-orange-500 mt-1">
                        Last free request! Subscribe for unlimited access.
                      </p>
                    )}
                  </>
                ) : quotaError ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Usage currently unavailable
                    </p>
                    <p className="text-xs text-amber-500 mt-1">
                      {quotaError}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can still generate content
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Loading usage...
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <a
                  href="https://moodybot.gumroad.com/l/moodybot-webapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                >
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Upgrade to Premium
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
          {/* Input Section */}
          <div className="space-y-6 pb-24">
            {/* Content Setup */}
            <Card className="bg-gradient-to-br from-red-900/10 to-amber-900/10 border-red-900/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-400">
                  <Feather className="h-5 w-5" />
                  <span>Content Setup</span>
                </CardTitle>
                <CardDescription>
                  Choose your content type and get started quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Type Selection */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Label className="text-sm font-medium">Step 1: Choose Content Type</Label>
                    <button
                      type="button"
                      aria-label="Content Type help"
                      aria-describedby="tt-content-type"
                      className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      onFocus={() => setActiveTooltip('content-type')}
                      onBlur={() => setActiveTooltip(null)}
                      onMouseEnter={() => setActiveTooltip('content-type')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'content-type' ? null : 'content-type')}
                    >
                      ?
                      {activeTooltip === 'content-type' && (
                        <div
                          id="tt-content-type"
                          role="tooltip"
                          className="absolute left-1/2 z-50 mt-2 w-64 -translate-x-1/2 rounded-md border border-red-900/30 bg-red-900/95 p-2 text-xs text-white shadow-lg pointer-events-none"
                        >
                          {getModeDescription(mode)}
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        mode === 'fiction_chapter' 
                          ? 'bg-blue-900/30 border-blue-500/50 ring-2 ring-blue-500/50' 
                          : 'bg-blue-900/10 border-blue-900/30 hover:bg-blue-800/20'
                      }`}
                      onClick={() => applyContentType('fiction_chapter')}
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-6 w-6 text-blue-400" />
                        <div>
                          <div className="font-medium text-sm">📖 Fiction Chapter</div>
                          <div className="text-xs text-muted-foreground">Full chapter prose with scene beats</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        mode === 'article' 
                          ? 'bg-blue-900/30 border-blue-500/50 ring-2 ring-blue-500/50' 
                          : 'bg-blue-900/10 border-blue-900/30 hover:bg-blue-800/20'
                      }`}
                      onClick={() => applyContentType('article')}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-blue-400" />
                        <div>
                          <div className="font-medium text-sm">📰 Article</div>
                          <div className="text-xs text-muted-foreground">Publish-ready essay or guide</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        mode === 'teaser_blurbs' 
                          ? 'bg-blue-900/30 border-blue-500/50 ring-2 ring-blue-500/50' 
                          : 'bg-blue-900/10 border-blue-900/30 hover:bg-blue-800/20'
                      }`}
                      onClick={() => applyContentType('teaser_blurbs')}
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="h-6 w-6 text-blue-400" />
                        <div>
                          <div className="font-medium text-sm">🎭 Teaser Blurbs</div>
                          <div className="text-xs text-muted-foreground">3-5 loglines or hooks</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        mode === 'fiction_outline' 
                          ? 'bg-blue-900/30 border-blue-500/50 ring-2 ring-blue-500/50' 
                          : 'bg-blue-900/10 border-blue-900/30 hover:bg-blue-800/20'
                      }`}
                      onClick={() => applyContentType('fiction_outline')}
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="h-6 w-6 text-blue-400" />
                        <div>
                          <div className="font-medium text-sm">🕵 Outline</div>
                          <div className="text-xs text-muted-foreground">Chapter list with summaries</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Step 2: Quick Presets (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllFields}
                      className="text-xs h-7 px-2 border-red-900/30 text-red-300 hover:bg-red-900/20"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div 
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        activePreset === 'fantasy_romance' 
                          ? 'bg-purple-900/30 border-purple-500/50 ring-2 ring-purple-500/50' 
                          : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                      }`}
                      onClick={() => applyQuickPreset('fantasy_romance')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-sm">✨</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Fantasy Romance</div>
                          <div className="text-xs text-muted-foreground">Princesses, magic, atmospheric prose</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        activePreset === 'marketing_article' 
                          ? 'bg-blue-900/30 border-blue-500/50 ring-2 ring-blue-500/50' 
                          : 'bg-blue-900/10 border-blue-900/30 hover:bg-blue-800/20'
                      }`}
                      onClick={() => applyQuickPreset('marketing_article')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                          <span className="text-white text-sm">📈</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Marketing Article</div>
                          <div className="text-xs text-muted-foreground">Clear, persuasive, conversion-focused</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        activePreset === 'mystery_thriller' 
                          ? 'bg-green-900/30 border-green-500/50 ring-2 ring-green-500/50' 
                          : 'bg-green-900/10 border-green-900/30 hover:bg-green-800/20'
                      }`}
                      onClick={() => applyQuickPreset('mystery_thriller')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <span className="text-white text-sm">🔍</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Mystery Thriller</div>
                          <div className="text-xs text-muted-foreground">Detective work, plot twists, clues</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        activePreset === 'comedy_sketch' 
                          ? 'bg-orange-900/30 border-orange-500/50 ring-2 ring-orange-500/50' 
                          : 'bg-orange-900/10 border-orange-900/30 hover:bg-orange-800/20'
                      }`}
                      onClick={() => applyQuickPreset('comedy_sketch')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                          <span className="text-white text-sm">🎭</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Comedy Sketch</div>
                          <div className="text-xs text-muted-foreground">Witty, satirical, punchy humor</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Settings */}
            <Card className="bg-gradient-to-br from-red-900/10 to-amber-900/10 border-red-900/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-400">
                  <FileText className="h-5 w-5" />
                  <span>Content Details</span>
                </CardTitle>
                <CardDescription>
                  Define your story, audience, and technical requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="topic" className="text-sm font-medium">Topic/Premise</Label>
                    {createTooltipButton('topic', 'Topic/Premise help', 'Describe your story concept, article topic, or creative premise. Be specific about the core idea.')}
                  </div>
                  <Textarea
                    id="topic"
                    placeholder="Describe your story, article topic, or creative premise..."
                    value={topicOrPremise}
                    onChange={(e) => {
                      console.log('Topic changed:', e.target.value);
                      setTopicOrPremise(e.target.value);
                    }}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="audience" className="text-sm font-medium">Target Audience</Label>
                    {createTooltipButton('audience', 'Target Audience help', 'Who should this feel written for? Be specific: "YA fantasy readers", "digital marketers", etc.')}
                  </div>
                  <Textarea
                    id="audience"
                    placeholder="Who is this for? (e.g., 'YA fantasy readers', 'digital marketers')"
                    value={audience}
                    onChange={(e) => {
                      console.log('Audience changed:', e.target.value);
                      setAudience(e.target.value);
                    }}
                    className="mt-1"
                  />
                </div>

                {/* Enhanced Word Count Controls */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Label className="text-sm font-medium">Word Count Range</Label>
                    {createTooltipButton('word-count', 'Word Count Range help', 'Set your target word count. The AI will aim for this range with a maximum limit.')}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Target: {wordCountTarget} words</span>
                        <span className="text-sm text-muted-foreground">Max: {maxWords} words</span>
                      </div>
                      <div className="relative">
                        <Slider
                          value={[wordCountTarget]}
                          onValueChange={(value) => setWordCountTarget(value[0])}
                          max={5000}
                          min={100}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>100</span>
                          <span>5,000</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="wordCount" className="text-xs text-muted-foreground">Target Words</Label>
                        <input
                          id="wordCount"
                          type="number"
                          value={wordCountTarget}
                          onChange={(e) => setWordCountTarget(Number(e.target.value))}
                          className="mt-1 w-full px-3 py-2 border border-red-900/30 rounded-md bg-red-900/10 text-sm"
                          min="100"
                          max="5000"
                          step="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxWords" className="text-xs text-muted-foreground">Max Words</Label>
                        <input
                          id="maxWords"
                          type="number"
                          value={maxWords}
                          onChange={(e) => setMaxWords(Number(e.target.value))}
                          className="mt-1 w-full px-3 py-2 border border-red-900/30 rounded-md bg-red-900/10 text-sm"
                          min={wordCountTarget}
                          max="10000"
                          step="50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="instructions" className="text-sm font-medium">Extra Instructions (Optional)</Label>
                    <button
                      type="button"
                      aria-label="Extra Instructions help"
                      aria-describedby="tt-instructions"
                      className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      onFocus={() => setActiveTooltip('instructions')}
                      onBlur={() => setActiveTooltip(null)}
                      onMouseEnter={() => setActiveTooltip('instructions')}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === 'instructions' ? null : 'instructions')}
                    >
                      ?
                      {activeTooltip === 'instructions' && (
                        <div
                          id="tt-instructions"
                          role="tooltip"
                          className="absolute left-1/2 z-50 mt-2 w-64 -translate-x-1/2 rounded-md border border-red-900/30 bg-red-900/95 p-2 text-xs text-white shadow-lg pointer-events-none"
                        >
                          Natural language instructions for style and tone. Examples: "Write it darker and more cinematic", "Keep the dialogue snappy", "Make the setting gothic"
                        </div>
                      )}
                    </button>
                  </div>
                  <Textarea
                    id="instructions"
                    placeholder="e.g., Write it darker and more cinematic, keep the dialogue snappy, make the setting gothic."
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="extras" className="text-sm font-medium">Extras (Optional)</Label>
                    {createTooltipButton('extras', 'Extras help', 'Additional instructions like "include dialogue", "use subheads", "present tense", etc.')}
                  </div>
                  <Textarea
                    id="extras"
                    placeholder="Additional instructions (e.g., 'include dialogue', 'use subheads')"
                    value={extras}
                    onChange={(e) => setExtras(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Auto Select Toggle */}
            <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-900/30 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-indigo-400">
                  <Zap className="h-5 w-5" />
                  <span>Auto Selection</span>
                </CardTitle>
                <CardDescription>
                  Let MoodyBot automatically detect the best form, genre, and style for your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-select"
                      checked={autoSelect}
                      onCheckedChange={setAutoSelect}
                    />
                    <Label htmlFor="auto-select" className="text-sm font-medium">
                      Auto Select (Recommended)
                    </Label>
                  </div>
                  {autoSelect && topicOrPremise && (
                    <div className="text-xs text-muted-foreground bg-indigo-900/20 px-2 py-1 rounded">
                      {getAutoSelectDisplay(topicOrPremise)}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {autoSelect 
                    ? "MoodyBot will analyze your prompt and automatically choose the best literary form, genre, POV, and structure."
                    : "You'll manually control all style settings below."
                  }
                </div>
              </CardContent>
            </Card>

            {/* Smart Persona Selector */}
            {topicOrPremise && audience && !autoSelect && (
              <Card className="bg-gradient-to-br from-violet-900/20 to-amber-900/20 border-violet-900/30 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-violet-400">
                    <Sparkles className="h-5 w-5" />
                    <span>Recommended Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Based on your topic and audience, here are suggested persona and style settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-violet-900/20 rounded-lg border border-violet-900/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-violet-300">Suggested Persona</div>
                          <div className="text-sm text-muted-foreground">{getRecommendedPersona(topicOrPremise, audience)}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyRecommendedSettings(topicOrPremise, audience)}
                          className="bg-violet-700 hover:bg-violet-800"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      💡 This will automatically set mood, intensity, edge, and gothic flourish based on your content type
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Style Dials */}
            <Card className="bg-gradient-to-br from-red-900/10 to-amber-900/10 border-red-900/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-amber-400">
                    <Sparkles className="h-5 w-5" />
                    <span>Style Dials</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (topicOrPremise && audience) {
                        const recommendation = recommendPersona({
                          contentMode: mode,
                          audience: audience,
                          topic: topicOrPremise
                        });
                        setMood(recommendation.persona === 'ogilvy' ? 'journalistic' : 
                               recommendation.persona === 'gothic_flourish' ? 'cinematic' :
                               recommendation.persona === 'forensic_files' ? 'wry' :
                               recommendation.persona === 'savage_roast' ? 'romantic' : 'gritty');
                        setIntensity([Math.round(recommendation.intensity * 5)]);
                        setEdge([Math.round(recommendation.edge * 5)]);
                      }
                    }}
                    className="text-xs border-amber-900/30 hover:bg-amber-800/20"
                    disabled={!topicOrPremise || !audience}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Select
                  </Button>
                </div>
                <CardDescription>
                  Fine-tune MoodyBot's voice and intensity with live preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label className="text-sm font-medium">Mood</Label>
                    {createTooltipButton('mood', 'Mood help', 'The overall emotional tone and writing style')}
                  </div>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gritty">Gritty</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                      <SelectItem value="wry">Wry</SelectItem>
                      <SelectItem value="journalistic">Journalistic</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-muted-foreground">
                    <strong>Preview:</strong> {getMoodPreview(mood)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label className="text-sm font-medium">Intensity: {intensity[0]}/5</Label>
                    {createTooltipButton('intensity', 'Intensity help', 'Sentence compression, vividness, and tempo. Higher = more intense writing.')}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>🟦 Subtle</span>
                    <span>🔥 Maximalist</span>
                  </div>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-muted-foreground">
                    <strong>Preview:</strong> {getIntensityPreview(intensity[0])}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label className="text-sm font-medium">Edge: {edge[0]}/5</Label>
                    {createTooltipButton('edge', 'Edge help', 'Spice/roast level. Keep ≤3 for brand-safe content.')}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>✨ Polite</span>
                    <span>🪓 Brutal</span>
                  </div>
                  <Slider
                    value={edge}
                    onValueChange={setEdge}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-muted-foreground">
                    <strong>Preview:</strong> {getEdgePreview(edge[0])}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label className="text-sm font-medium">Carebear to Policehorse: {carebearToPolicehorse[0]}/10</Label>
                    {createTooltipButton('carebear', 'Carebear to Policehorse help', 'Softness vs. brutality scale. 0 = gentle, 10 = harsh.')}
                  </div>
                  <Slider
                    value={carebearToPolicehorse}
                    onValueChange={setCarebearToPolicehorse}
                    max={10}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                  <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-muted-foreground">
                    <strong>Preview:</strong> {getCarebearPreview(carebearToPolicehorse[0])}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="gothic-flourish"
                    checked={gothicFlourish}
                    onCheckedChange={setGothicFlourish}
                  />
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="gothic-flourish" className="text-sm font-medium">Gothic Flourish</Label>
                    {createTooltipButton('gothic', 'Gothic Flourish help', 'Add dark, atmospheric imagery and poetic language')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Persona Selector */}
            <Card className="bg-gradient-to-br from-purple-900/10 to-indigo-900/10 border-purple-900/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                  <span>Persona Selector</span>
                </CardTitle>
                <CardDescription>
                  Choose your writing voice and see preview examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      mood === 'gritty' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setMood('gritty')}
                  >
                    <div className="font-medium text-sm mb-1">MoodyBot Default (Dark, Witty)</div>
                    <div className="text-xs text-muted-foreground italic">
                      "The whiskey burns going down, but it's the memories that really hurt."
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      mood === 'cinematic' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setMood('cinematic')}
                  >
                    <div className="font-medium text-sm mb-1">Gothic Flourish (Mythic, Poetic)</div>
                    <div className="text-xs text-muted-foreground italic">
                      "The old gods sleep beneath the city, their dreams woven into the very stones."
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      mood === 'journalistic' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setMood('journalistic')}
                  >
                    <div className="font-medium text-sm mb-1">Ogilvy (Marketing Clarity)</div>
                    <div className="text-xs text-muted-foreground italic">
                      "People don't buy products. They buy better versions of themselves."
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      mood === 'wry' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setMood('wry')}
                  >
                    <div className="font-medium text-sm mb-1">Forensic Files (Analytical, Precise)</div>
                    <div className="text-xs text-muted-foreground italic">
                      "The evidence doesn't lie. Every detail tells a story, every clue leads to truth."
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      mood === 'romantic' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setMood('romantic')}
                  >
                    <div className="font-medium text-sm mb-1">Savage Roast (Brutal Satire)</div>
                    <div className="text-xs text-muted-foreground italic">
                      "Your startup idea is so original, I'm surprised it hasn't been featured on 'Shark Tank' yet."
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creative Writing Mood Toggles */}
            <Card className="bg-gradient-to-br from-purple-900/10 to-indigo-900/10 border-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-400">
                  <Zap className="h-5 w-5" />
                  <span>Creative Writing Moods</span>
                </CardTitle>
                <CardDescription>
                  Choose the emotional tone for your narrative prose
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'desperate_flight' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('desperate_flight')}
                  >
                    <div className="font-medium text-sm">🏃 Desperate Flight</div>
                    <div className="text-xs text-muted-foreground">Chase scenes, escapes, danger</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'romantic_gothic' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('romantic_gothic')}
                  >
                    <div className="font-medium text-sm">🌙 Romantic Gothic</div>
                    <div className="text-xs text-muted-foreground">Atmospheric worldbuilding</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'seduction_surrender' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('seduction_surrender')}
                  >
                    <div className="font-medium text-sm">💋 Seduction & Surrender</div>
                    <div className="text-xs text-muted-foreground">Intimate tension, kisses</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'horror_dread' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('horror_dread')}
                  >
                    <div className="font-medium text-sm">👻 Horror & Dread</div>
                    <div className="text-xs text-muted-foreground">Spirits, curses, Deadwood</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'battle_fury' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('battle_fury')}
                  >
                    <div className="font-medium text-sm">⚔️ Battle & Fury</div>
                    <div className="text-xs text-muted-foreground">Army clashes, magic unleashed</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'heartbreak_memory' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('heartbreak_memory')}
                  >
                    <div className="font-medium text-sm">💔 Heartbreak & Memory Loss</div>
                    <div className="text-xs text-muted-foreground">After each kiss, losing ties</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'defiance_transformation' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('defiance_transformation')}
                  >
                    <div className="font-medium text-sm">👑 Defiance & Transformation</div>
                    <div className="text-xs text-muted-foreground">Claiming power, throne of ashes</div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedMood === 'quiet_lament' 
                        ? 'bg-purple-900/30 border-purple-500/50' 
                        : 'bg-purple-900/10 border-purple-900/30 hover:bg-purple-800/20'
                    }`}
                    onClick={() => setSelectedMood('quiet_lament')}
                  >
                    <div className="font-medium text-sm">🌅 Quiet Lament</div>
                    <div className="text-xs text-muted-foreground">After loss, reflective pauses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sticky Generate Button */}
            <div className="sticky bottom-4 z-10">
              <Button
                onClick={handleGenerate}
                disabled={loading || rateLimited || isSubmitting}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-700 via-red-700 to-amber-500 hover:from-violet-800 hover:via-red-800 hover:to-amber-600 shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || isSubmitting ? (
                  <>
                    <Sparkles className="mr-3 h-5 w-5 animate-spin" />
                    {getModeActionText(mode)}...
                  </>
                ) : rateLimited ? (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    Upgrade to Continue
                  </>
                ) : (
                  <>
                    <Feather className="mr-3 h-5 w-5" />
                    {getModeActionText(mode)}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="sticky top-4">
            {/* Error Display */}
            {err && (
              <Card className="mb-6 bg-red-900/20 border-red-500/30 shadow-lg">
                <CardContent className="pt-6">
                  <p className="text-red-400 text-center">{err}</p>
                </CardContent>
              </Card>
            )}

            {/* Result Display */}
            {result && (
              <Card className="bg-gradient-to-br from-red-900/10 to-amber-900/10 border-red-900/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-400">
                      {getModeIcon(result.mode)}
                      <span>Generated Content</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.content)}
                        className="text-xs border-red-900/30 hover:bg-red-800/20"
                      >
                        📋 Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: Implement save preset */}}
                        className="text-xs border-red-900/30 hover:bg-red-800/20"
                      >
                        💾 Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        className="text-xs border-red-900/30 hover:bg-red-800/20"
                      >
                        🔄 Regenerate
                      </Button>
                      {result.completion_status === "truncated" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResume}
                          className="text-xs border-yellow-900/30 hover:bg-yellow-800/20 ml-2"
                        >
                          ➕ Resume
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {getModeDescription(result.mode)} • {result.word_count_target} words target
                    {result.usage?.words && (
                      <span className="ml-2 text-green-400">
                        ({result.usage.words} words generated)
                      </span>
                    )}
                    {result.completion_status === "truncated" && (
                      <div className="mt-2 text-xs text-yellow-300 bg-yellow-900/20 px-2 py-1 rounded">
                        ⚠️ Content was truncated due to length limits
                      </div>
                    )}
                    {result.completion_status === "completed" && (
                      <div className="mt-2 text-xs text-green-300 bg-green-900/20 px-2 py-1 rounded">
                        ✅ Content completed automatically
                      </div>
                    )}
                    {result.auto_selected && result.routing && (
                      <div className="mt-2 text-xs text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded">
                        Auto-selected: {result.routing.style} • {result.routing.genre} • {result.routing.pov} • {result.routing.tense}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap font-medium leading-relaxed text-base" style={{ color: '#ffffff' }}>
                      {result.content}
                    </div>
                  </div>
                  
                  {/* Word Count Display */}
                  <div className="mt-4 pt-4 border-t border-red-900/30">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Word Count:</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-amber-200 font-medium">
                          {countWords(result.content)} words
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: {result.word_count_target} | Max: {result.max_words}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Style Dials Used */}
                  <div className="mt-4 pt-4 border-t border-red-900/30">
                    <p className="text-xs text-muted-foreground mb-2">Style used:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-red-900/20 text-amber-200 rounded text-xs">
                        {result.style_dials.mood}
                      </span>
                      <span className="px-2 py-1 bg-red-900/20 text-amber-200 rounded text-xs">
                        intensity: {result.style_dials.intensity}
                      </span>
                      <span className="px-2 py-1 bg-red-900/20 text-amber-200 rounded text-xs">
                        edge: {result.style_dials.edge}
                      </span>
                      {result.style_dials.gothic_flourish && (
                        <span className="px-2 py-1 bg-red-900/20 text-amber-200 rounded text-xs">
                          gothic
                        </span>
                      )}
                      <span className="px-2 py-1 bg-red-900/20 text-amber-200 rounded text-xs">
                        cbph: {result.style_dials.carebear_to_policehorse}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Placeholder when no result */}
            {!result && !err && (
              <Card className="bg-gradient-to-br from-gray-900/10 to-gray-800/10 border-gray-800/20 shadow-lg">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center text-muted-foreground">
                    <Feather className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Ready to Create</p>
                    <p className="text-sm">Fill in your details and click generate to see your content here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Standard Footer */}
      <StandardFooter />
    </div>
  );
}
