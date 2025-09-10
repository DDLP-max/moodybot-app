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

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            {/* Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getModeIcon(mode)}
                  <span>Content Mode</span>
                </CardTitle>
                <CardDescription>
                  {getModeDescription(mode)}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Presets */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
                <CardDescription>
                  Load example configurations to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('fiction_chapter')}
                    className="text-xs"
                  >
                    Fantasy Romance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('article')}
                    className="text-xs"
                  >
                    Marketing Article
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('fiction_outline')}
                    className="text-xs"
                  >
                    Mystery Outline
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('teaser_blurbs')}
                    className="text-xs"
                  >
                    Comedy Blurbs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Basic Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic/Premise</Label>
                  <Textarea
                    id="topic"
                    placeholder="Describe your story, article topic, or creative premise..."
                    value={topicOrPremise}
                    onChange={(e) => setTopicOrPremise(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="Who is this for? (e.g., 'YA fantasy readers', 'digital marketers')"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wordCount">Word Count Target</Label>
                    <input
                      id="wordCount"
                      type="number"
                      value={wordCountTarget}
                      onChange={(e) => setWordCountTarget(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxWords">Max Words</Label>
                    <input
                      id="maxWords"
                      type="number"
                      value={maxWords}
                      onChange={(e) => setMaxWords(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="structure">Structure (Optional)</Label>
                  <Textarea
                    id="structure"
                    placeholder="Describe the structure or beats you want..."
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="extras">Extras (Optional)</Label>
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
            <Card>
              <CardHeader>
                <CardTitle>Style Dials</CardTitle>
                <CardDescription>
                  Fine-tune MoodyBot's voice and intensity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Mood</Label>
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
                </div>

                <div>
                  <Label>Intensity: {intensity[0]}/5</Label>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sentence compression, vividness, tempo
                  </p>
                </div>

                <div>
                  <Label>Edge: {edge[0]}/5</Label>
                  <Slider
                    value={edge}
                    onValueChange={setEdge}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Spice/roast level (keep ≤3 for brand-safe)
                  </p>
                </div>

                <div>
                  <Label>Carebear to Policehorse: {carebearToPolicehorse[0]}/10</Label>
                  <Slider
                    value={carebearToPolicehorse}
                    onValueChange={setCarebearToPolicehorse}
                    max={10}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    0 = soft, 10 = brutal
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="gothic-flourish"
                    checked={gothicFlourish}
                    onCheckedChange={setGothicFlourish}
                  />
                  <Label htmlFor="gothic-flourish">Gothic Flourish</Label>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-700 to-amber-500 hover:from-violet-800 hover:to-amber-600"
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating Creative Content...
                </>
              ) : (
                <>
                  <Feather className="mr-2 h-4 w-4" />
                  Generate Creative Content
                </>
              )}
            </Button>
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
