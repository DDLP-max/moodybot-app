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
import { ArrowLeft, Copy, Sparkles, Feather, BookOpen, FileText, Zap } from "lucide-react";
import { useQuestionLimit } from "@/hooks/use-question-limit";

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
}

export default function CreativeWriterPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreativeWriterResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { questionLimit, refreshQuestionLimit } = useQuestionLimit();

  // Refresh question limit on component mount
  useEffect(() => {
    refreshQuestionLimit(1); // Using default user ID 1
  }, [refreshQuestionLimit]);

  // Form state
  const [mode, setMode] = useState("fiction_chapter");
  const [topicOrPremise, setTopicOrPremise] = useState("");
  const [audience, setAudience] = useState("");
  const [wordCountTarget, setWordCountTarget] = useState(1000);
  const [maxWords, setMaxWords] = useState(1100);
  const [structure, setStructure] = useState("");
  const [extras, setExtras] = useState("");
  
  // Style dials
  const [mood, setMood] = useState("gritty");
  const [intensity, setIntensity] = useState([3]);
  const [edge, setEdge] = useState([3]);
  const [gothicFlourish, setGothicFlourish] = useState(false);
  const [carebearToPolicehorse, setCarebearToPolicehorse] = useState([5]);

  // Presets
  const presets = {
    fiction_chapter: {
      topic: "Throne of Ashes — runaway princess bargains with the God of Crows; each kiss erases a memory.",
      audience: "fantasy romance readers (YA/NA blend)",
      wordCount: 1000,
      maxWords: 1100,
      structure: "Cold open image (2–3 paragraphs) • Inciting encounter (dialogue forward) • Price of the pact revealed (sensory, internal conflict) • Turn: first kiss, first memory lost • Cliffhanger last line",
      extras: "3–5 lines of sharp dialogue; present tense",
      mood: "cinematic",
      intensity: 4,
      edge: 2,
      gothicFlourish: true,
      carebearToPolicehorse: 3
    },
    article: {
      topic: "People buy status, not products—how to position without cringe.",
      audience: "digital marketers",
      wordCount: 500,
      maxWords: 550,
      structure: "Thesis in two punchy paragraphs • 3 subheads: 'Belonging > Features', 'Signals & Shortcut Brain', 'Position Without Desperation' • Close with 2-step CTA",
      extras: "Use examples, ban buzzwords, skimmable",
      mood: "journalistic",
      intensity: 3,
      edge: 3,
      gothicFlourish: false,
      carebearToPolicehorse: 4
    },
    fiction_outline: {
      topic: "A detective with synesthesia solves crimes by tasting lies.",
      audience: "mystery/thriller readers",
      wordCount: 1200,
      maxWords: 1300,
      structure: "12 chapters with 2-3 sentence summaries each",
      extras: "Include character arcs and plot twists",
      mood: "noir",
      intensity: 4,
      edge: 4,
      gothicFlourish: true,
      carebearToPolicehorse: 6
    },
    teaser_blurbs: {
      topic: "A time-traveling barista who can only travel to coffee shops.",
      audience: "comedy/sci-fi readers",
      wordCount: 300,
      maxWords: 350,
      structure: "5 different loglines/hooks from the same premise",
      extras: "Mix of serious and comedic angles",
      mood: "wry",
      intensity: 3,
      edge: 2,
      gothicFlourish: false,
      carebearToPolicehorse: 3
    }
  };

  const applyPreset = (presetKey: keyof typeof presets) => {
    const preset = presets[presetKey];
    setTopicOrPremise(preset.topic);
    setAudience(preset.audience);
    setWordCountTarget(preset.wordCount);
    setMaxWords(preset.maxWords);
    setStructure(preset.structure);
    setExtras(preset.extras);
    setMood(preset.mood);
    setIntensity([preset.intensity]);
    setEdge([preset.edge]);
    setGothicFlourish(preset.gothicFlourish);
    setCarebearToPolicehorse([preset.carebearToPolicehorse]);
  };

  async function handleGenerate() {
    setErr(null);
    if (!topicOrPremise.trim() || !audience.trim()) { 
      setErr("Please provide both a topic/premise and target audience."); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/creative-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          userId: 1 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Request failed");
      
      // Check if limit reached
      if (data.limitReached) {
        setResult(null);
        setErr("Limit reached. Please subscribe for unlimited access.");
      } else {
        setResult(data.result);
        // Refresh question limit from server
        await refreshQuestionLimit(1);
      }
    } catch (e: any) {
      setErr(e.message || "Something broke");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      case 'fiction_chapter': return '✍️ Write Chapter';
      case 'fiction_outline': return '📝 Draft Outline';
      case 'article': return '📰 Craft Article';
      case 'teaser_blurbs': return '🎭 Create Blurbs';
      default: return '✍️ Generate Content';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-red-900/5 to-amber-900/5 text-foreground relative">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(127,29,29,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(146,64,14,0.03),transparent_50%)] pointer-events-none" />
      {/* Header */}
      <div className="border-b border-primary/20 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Feather className="text-amber-500 text-xl" />
              <span className="font-black text-lg">Creative Writer Mode</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="text-amber-500 h-5 w-5" />
            <span className="text-sm text-muted-foreground">Powered by Grok-4</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-700 to-amber-500 bg-clip-text text-transparent">
            Creative Writer Mode
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Dive-bar oracle meets copywriter: Hank Moody swagger + Anthony Bourdain grit
          </p>
          <p className="text-sm text-muted-foreground">
            Fiction • Articles • Outlines • Teaser Blurbs
          </p>
        </div>

        {/* Question Limit Display */}
        <Card className="mb-4 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                {questionLimit ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {questionLimit.remaining} of {questionLimit.limit} creative writing requests remaining
                    </p>
                    {questionLimit.remaining <= 1 && questionLimit.remaining > 0 && (
                      <p className="text-xs text-orange-500 mt-1">
                        Last free request! Subscribe for unlimited access.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    3 of 3 creative writing requests remaining
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Content Mode & Presets Group */}
            <Card className="bg-gradient-to-br from-red-900/10 to-amber-900/10 border-red-900/20">
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
                {/* Mode Selection */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label className="text-sm font-medium">Content Mode</Label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        {getModeDescription(mode)}
                      </div>
                    </div>
                  </div>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiction_chapter">Fiction Chapter</SelectItem>
                      <SelectItem value="fiction_outline">Fiction Outline</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="teaser_blurbs">Teaser Blurbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhanced Presets */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div 
                      className="p-3 rounded-lg border border-red-900/30 bg-gradient-to-r from-red-900/20 to-amber-900/20 hover:from-red-800/30 hover:to-amber-800/30 cursor-pointer transition-all duration-200"
                      onClick={() => applyPreset('fiction_chapter')}
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-amber-400" />
                        <div>
                          <div className="font-medium text-sm">Fantasy Romance</div>
                          <div className="text-xs text-muted-foreground">Runaway princess bargains with the God of Crows</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border border-red-900/30 bg-gradient-to-r from-red-900/20 to-amber-900/20 hover:from-red-800/30 hover:to-amber-800/30 cursor-pointer transition-all duration-200"
                      onClick={() => applyPreset('article')}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-amber-400" />
                        <div>
                          <div className="font-medium text-sm">Marketing Article</div>
                          <div className="text-xs text-muted-foreground">People buy status, not products</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border border-red-900/30 bg-gradient-to-r from-red-900/20 to-amber-900/20 hover:from-red-800/30 hover:to-amber-800/30 cursor-pointer transition-all duration-200"
                      onClick={() => applyPreset('fiction_outline')}
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-amber-400" />
                        <div>
                          <div className="font-medium text-sm">Mystery Outline</div>
                          <div className="text-xs text-muted-foreground">Detective with synesthesia solves crimes</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border border-red-900/30 bg-gradient-to-r from-red-900/20 to-amber-900/20 hover:from-red-800/30 hover:to-amber-800/30 cursor-pointer transition-all duration-200"
                      onClick={() => applyPreset('teaser_blurbs')}
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-amber-400" />
                        <div>
                          <div className="font-medium text-sm">Comedy Blurbs</div>
                          <div className="text-xs text-muted-foreground">Time-traveling barista adventures</div>
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
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Describe your story concept, article topic, or creative premise. Be specific about the core idea.
                      </div>
                    </div>
                  </div>
                  <Textarea
                    id="topic"
                    placeholder="Describe your story, article topic, or creative premise..."
                    value={topicOrPremise}
                    onChange={(e) => setTopicOrPremise(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="audience" className="text-sm font-medium">Target Audience</Label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Who should this feel written for? Be specific: "YA fantasy readers", "digital marketers", etc.
                      </div>
                    </div>
                  </div>
                  <Textarea
                    id="audience"
                    placeholder="Who is this for? (e.g., 'YA fantasy readers', 'digital marketers')"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Enhanced Word Count Controls */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Label className="text-sm font-medium">Word Count Range</Label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Set your target word count. The AI will aim for this range with a maximum limit.
                      </div>
                    </div>
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
                    <Label htmlFor="structure" className="text-sm font-medium">Structure (Optional)</Label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Describe the structure or beats you want. For example: "3 acts with plot twist in act 2"
                      </div>
                    </div>
                  </div>
                  <Textarea
                    id="structure"
                    placeholder="Describe the structure or beats you want..."
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="extras" className="text-sm font-medium">Extras (Optional)</Label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Additional instructions like "include dialogue", "use subheads", "present tense", etc.
                      </div>
                    </div>
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

            {/* Style Dials */}
            <Card className="bg-gradient-to-br from-red-900/10 to-amber-900/10 border-red-900/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-400">
                  <Sparkles className="h-5 w-5" />
                  <span>Style Dials</span>
                </CardTitle>
                <CardDescription>
                  Fine-tune MoodyBot's voice and intensity with live preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label className="text-sm font-medium">Mood</Label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        The overall emotional tone and writing style
                      </div>
                    </div>
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
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Sentence compression, vividness, and tempo. Higher = more intense writing.
                      </div>
                    </div>
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
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Spice/roast level. Keep ≤3 for brand-safe content.
                      </div>
                    </div>
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
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Softness vs. brutality scale. 0 = gentle, 10 = harsh.
                      </div>
                    </div>
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
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center cursor-help">
                        <span className="text-xs text-amber-400">?</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-red-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Add dark, atmospheric imagery and poetic language
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Generate Button */}
            <div className="sticky bottom-4 z-10">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-700 via-red-700 to-amber-500 hover:from-violet-800 hover:via-red-800 hover:to-amber-600 shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Sparkles className="mr-3 h-5 w-5 animate-spin" />
                    {getModeActionText(mode)}...
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
          <div>
            {/* Error Display */}
            {err && (
              <Card className="mb-6 bg-red-900/20 border-red-500/30">
                <CardContent className="pt-6">
                  <p className="text-red-400 text-center">{err}</p>
                </CardContent>
              </Card>
            )}

            {/* Result Display */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getModeIcon(result.mode)}
                      <span>Generated Content</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.content)}
                      className="hover:bg-primary/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {getModeDescription(result.mode)} • {result.word_count_target} words target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {result.content}
                    </div>
                  </div>
                  
                  {/* Style Dials Used */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Style used:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {result.style_dials.mood}
                      </span>
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        intensity: {result.style_dials.intensity}
                      </span>
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        edge: {result.style_dials.edge}
                      </span>
                      {result.style_dials.gothic_flourish && (
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          gothic
                        </span>
                      )}
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        cbph: {result.style_dials.carebear_to_policehorse}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
