"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, Heart, Shield, Zap, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuestionLimit } from "@/hooks/use-question-limit";
import { StandardHeader, StandardFooter } from "@/components/StandardHeader";
import { MODE_BUTTON_BASE, MODE_THEME } from "@/theme/modes";
import AppFooter from "@/components/AppFooter";

const RELATIONSHIPS = [
  { value: "stranger", label: "Stranger" },
  { value: "acquaintance", label: "Acquaintance" },
  { value: "friend", label: "Friend" },
  { value: "partner", label: "Partner" },
  { value: "coworker", label: "Coworker" },
  { value: "client", label: "Client" }
];

const STYLES = [
  { value: "warm", label: "Warm", icon: Heart },
  { value: "blunt", label: "Blunt", icon: Shield },
  { value: "playful", label: "Playful", icon: Zap },
  { value: "clinical", label: "Clinical", icon: MessageSquare },
  { value: "moodybot", label: "MoodyBot", icon: MessageSquare }
];

const LENGTH_OPTIONS = [
  { value: "one_liner", label: "1-liner", description: "≤18 words" },
  { value: "short", label: "2-3 lines", description: "≤45 words" },
  { value: "paragraph", label: "Short paragraph", description: "≤120 words" }
];

const REASON_TAGS = [
  "effort", "courage", "honesty", "competence", "taste", "boundaries", "resilience"
];

const INTENSITY_LABELS = ["Feather", "Casual", "Firm", "Heavy"];

interface ValidationResponse {
  validation: string;
  because: string;
  push_pull?: string;
  followup?: string;
}

interface ValidationAPIResponse {
  output: ValidationResponse;
  notes?: string;
}

export default function ValidationMode() {
  const [, setLocation] = useLocation();
  const { questionLimit, refreshQuestionLimit } = useQuestionLimit();
  const [context, setContext] = useState("");
  const [relationship, setRelationship] = useState("friend");
  const [mode, setMode] = useState<"positive" | "negative" | "mixed">("positive");
  const [style, setStyle] = useState("warm");
  const [intensity, setIntensity] = useState([1]);
  const [length, setLength] = useState("short");
  const [reasonTags, setReasonTags] = useState<string[]>([]);
  const [includeFollowup, setIncludeFollowup] = useState(false);
  const [order, setOrder] = useState<"pos_neg" | "neg_pos">("pos_neg");
  const [response, setResponse] = useState<ValidationResponse | null>(null);
  const [responseNotes, setResponseNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReasonTagToggle = (tag: string) => {
    setReasonTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    if (!context.trim()) return;
    
    setIsLoading(true);
    try {
      const payload = {
        mode,
        style,
        intensity: intensity[0],
        length,
        relationship,
        reason_tags: reasonTags,
        order,
        include_followup: includeFollowup,
        context_text: context
      };

      const res = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to generate validation');
      
      const data: ValidationAPIResponse = await res.json();
      setResponse(data.output);
      setResponseNotes(data.notes || "");
      
      // Refresh question limit after successful request
      if (data.remaining !== undefined) {
        refreshQuestionLimit();
      }
    } catch (error) {
      console.error('Error generating validation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    const text = [response.validation, response.because, response.push_pull, response.followup]
      .filter(Boolean)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const isWorkplace = relationship === "coworker" || relationship === "client";
  const maxIntensity = isWorkplace ? 2 : 3;

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1C1C1C 100%)' }}>
      {/* Standard Header */}
      <StandardHeader modeName="Validation Mode" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Question Limit Display */}
        {questionLimit && (
          <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(45, 212, 191, 0.05)', borderColor: 'rgba(45, 212, 191, 0.2)' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-300">
                    {questionLimit.remaining > 0 
                      ? `${questionLimit.remaining} free validation request${questionLimit.remaining === 1 ? '' : 's'} remaining`
                      : 'No free validation requests remaining'
                    }
                  </p>
                  {questionLimit.remaining <= 1 && questionLimit.remaining > 0 && (
                    <p className="text-xs text-orange-400 mt-1">
                      Last free request! Subscribe for unlimited access.
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => window.open('https://moodybot.gumroad.com/l/moodybot-webapp', '_blank')}
                    size="sm"
                    className="bg-val text-white hover-bright"
                  >
                    Subscribe $9/month
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Section */}
        <Card className="border-0 shadow-2xl" style={{ backgroundColor: 'rgba(45, 212, 191, 0.05)', borderColor: 'rgba(45, 212, 191, 0.2)' }}>
          <CardHeader>
            <CardTitle className="text-white">Generate Validation Response</CardTitle>
            <CardDescription className="text-gray-300">
              Cut through noise with presence. This mode mirrors back what was said and delivers calibrated validation — from warm approval to firm boundary-setting. Choose Positive, Negative, or Mixed push-pull to reinforce strengths, call out blind spots, or do both in one breath. It's not therapy or advice — it's the art of making people feel seen while keeping your own standards intact.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Context Input */}
            <div className="space-y-2">
              <Label htmlFor="context" className="text-white">Context / Message</Label>
              <Textarea
                id="context"
                placeholder="What they said or did that you want to validate..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400 focus:ring-teal-400"
              />
            </div>

            {/* Relationship and Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Relationship</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:border-teal-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel.value} value={rel.value} className="text-white hover:bg-gray-700">
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Mode</Label>
                <Tabs value={mode} onValueChange={(value) => setMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                    <TabsTrigger 
                      value="positive" 
                      className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      ✅ Positive
                    </TabsTrigger>
                    <TabsTrigger 
                      value="negative"
                      className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                    >
                      ⚡ Negative
                    </TabsTrigger>
                    <TabsTrigger 
                      value="mixed"
                      className={`data-[state=active]:bg-val data-[state=active]:text-white`}
                    >
                      🔄 Mixed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Style and Intensity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:border-teal-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <s.icon className="h-4 w-4" />
                          <span>{s.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Intensity: {INTENSITY_LABELS[intensity[0]]}</Label>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={maxIntensity}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  {INTENSITY_LABELS.slice(0, maxIntensity + 1).map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Length and Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Length</Label>
                <div className="flex space-x-2">
                  {LENGTH_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={length === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLength(option.value)}
                      className={length === option.value 
                        ? `bg-val hover-bright text-white` 
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {LENGTH_OPTIONS.find(o => o.value === length)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="followup"
                    checked={includeFollowup}
                    onCheckedChange={setIncludeFollowup}
                  />
                  <Label htmlFor="followup" className="text-white">Include follow-up question</Label>
                </div>
              </div>
            </div>

            {/* Reason Tags */}
            <div className="space-y-2">
              <Label className="text-white">Reason Tags (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {REASON_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={reasonTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      reasonTags.includes(tag) 
                        ? `bg-val text-white` 
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => handleReasonTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mixed Mode Order */}
            {mode === "mixed" && (
              <div className="space-y-2">
                <Label className="text-white">Push→Pull Order</Label>
                <Tabs value={order} onValueChange={(value) => setOrder(value as any)}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                    <TabsTrigger 
                      value="pos_neg"
                      className={`data-[state=active]:bg-val data-[state=active]:text-white`}
                    >
                      + → –
                    </TabsTrigger>
                    <TabsTrigger 
                      value="neg_pos"
                      className={`data-[state=active]:bg-val data-[state=active]:text-white`}
                    >
                      – → +
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!context.trim() || isLoading}
              className={`${MODE_BUTTON_BASE} ${MODE_THEME.validation.bg} ${MODE_THEME.validation.hover} ${MODE_THEME.validation.ring} w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Validation"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Response Section */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-2xl" style={{ backgroundColor: 'rgba(45, 212, 191, 0.05)', borderColor: 'rgba(45, 212, 191, 0.2)' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Validation Response</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopy}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegenerate}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode/Style/Intensity Chips */}
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`${
                      mode === 'positive' ? 'bg-emerald-500 text-white' :
                      mode === 'negative' ? 'bg-amber-500 text-white' :
                      'bg-gradient-to-r from-teal-500 to-amber-500 text-white'
                    }`}
                  >
                    {mode === 'positive' ? '✅' : mode === 'negative' ? '⚡' : '🔄'} {mode}
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">{style}</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">{INTENSITY_LABELS[intensity[0]]}</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">{length}</Badge>
                  {responseNotes && (
                    <Badge variant="secondary" className="bg-val text-white">
                      DBT: {responseNotes.match(/L[1-6]/)?.[0] || 'Level'}
                    </Badge>
                  )}
                </div>

                {/* Validation Response */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    mode === 'positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
                    mode === 'negative' ? 'border-l-amber-500 bg-amber-500/10' :
                    'border-l-teal-400 bg-gradient-to-r from-teal-400/10 to-violet-500/10'
                  }`}>
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation</h4>
                    <p className="text-white text-lg">{response.validation}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-600">
                    <h4 className="font-semibold text-sm text-gray-300 mb-2 italic">Because</h4>
                    <p className="text-white italic">{response.because}</p>
                  </div>

                  {response.push_pull && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                      mode === 'positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
                      mode === 'negative' ? 'border-l-amber-500 bg-amber-500/10' :
                      'border-l-teal-400 bg-gradient-to-r from-teal-400/10 to-violet-500/10'
                    }`}>
                      <h4 className="font-semibold text-sm text-gray-300 mb-2">Push/Pull</h4>
                      <p className="text-white">{response.push_pull}</p>
                    </div>
                  )}

                  {response.followup && (
                    <div className="p-4 rounded-full bg-purple-600 text-white text-center">
                      <h4 className="font-semibold text-sm mb-2">Follow-up Question</h4>
                      <p className="text-sm">{response.followup}</p>
                    </div>
                  )}

                  {/* DBT Level Explanation */}
                  {responseNotes && (
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-600">
                      <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation Depth</h4>
                      <p className="text-sm text-gray-400 italic">{responseNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
