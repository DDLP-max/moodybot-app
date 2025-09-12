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
import { MODE_THEME } from "@/theme/modes";
import AppFooter from "@/components/AppFooter";
import ValidationResult from "@/components/ValidationResult";
import { ValidationInput, ValidationOutput } from "@/lib/types/validation";

const RELATIONSHIPS = [
  { value: "Stranger", label: "Stranger" },
  { value: "Friend", label: "Friend" },
  { value: "Partner", label: "Partner" },
  { value: "Family", label: "Family" },
  { value: "Colleague", label: "Colleague" }
];

const STYLES = [
  { value: "Warm", label: "Warm", icon: Heart },
  { value: "Direct", label: "Direct", icon: Shield },
  { value: "Playful", label: "Playful", icon: Zap },
  { value: "Dry", label: "Dry", icon: MessageSquare },
  { value: "Elegant", label: "Elegant", icon: MessageSquare },
  { value: "Street", label: "Street", icon: MessageSquare },
  { value: "Professional", label: "Professional", icon: MessageSquare }
];

const LENGTH_OPTIONS = [
  { value: "one_liner", label: "1-liner", description: "≤160 chars" },
  { value: "two_three_lines", label: "2-3 lines", description: "≤320 chars" },
  { value: "short_paragraph", label: "Short paragraph", description: "≤520 chars" }
];

const REASON_TAGS = [
  "effort", "courage", "honesty", "competence", "taste", "boundaries", "resilience"
];

const INTENSITY_LABELS = ["Feather", "Casual", "Firm", "Heavy"];

interface ValidationAPIResponse extends ValidationOutput {
  remaining?: number;
  limit?: number;
}

export default function ValidationMode() {
  const [, setLocation] = useLocation();
  const { questionLimit, refreshQuestionLimit } = useQuestionLimit();
  const [context, setContext] = useState("");
  const [relationship, setRelationship] = useState<ValidationInput['relationship']>("Friend");
  const [mode, setMode] = useState<ValidationInput['mode']>("Positive");
  const [style, setStyle] = useState<ValidationInput['style']>("Warm");
  const [intensity, setIntensity] = useState<ValidationInput['intensity']>("Casual");
  const [length, setLength] = useState<ValidationInput['length']>("one_liner");
  const [reasonTags, setReasonTags] = useState<string[]>([]);
  const [includeFollowup, setIncludeFollowup] = useState(false);
  const [response, setResponse] = useState<ValidationOutput | null>(null);
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
      const payload: ValidationInput = {
        context,
        relationship,
        mode,
        style,
        intensity,
        length,
        reason_tags: reasonTags,
        include_followup: includeFollowup,
        userId: 1
      };

      const res = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to generate validation');
      
      const data: ValidationAPIResponse = await res.json();
      setResponse(data);
      
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
    navigator.clipboard.writeText(response.response);
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
                <Tabs value={mode} onValueChange={(value) => setMode(value as ValidationInput['mode'])}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                    <TabsTrigger 
                      value="Positive" 
                      className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      ✅ Positive
                    </TabsTrigger>
                    <TabsTrigger 
                      value="Negative"
                      className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                    >
                      ⚡ Negative
                    </TabsTrigger>
                    <TabsTrigger 
                      value="Mixed"
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
                <Label className="text-white">Intensity</Label>
                <Select value={intensity} onValueChange={(value) => setIntensity(value as ValidationInput['intensity'])}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:border-teal-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {INTENSITY_LABELS.map((intensityLabel) => (
                      <SelectItem key={intensityLabel} value={intensityLabel} className="text-white hover:bg-gray-700">
                        {intensityLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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


            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!context.trim() || isLoading}
              className={`${MODE_THEME.validation.bg} ${MODE_THEME.validation.hover} ${MODE_THEME.validation.ring} w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
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
              <CardContent>
                <ValidationResult payload={response} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
