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
import StandardHeader from "@/components/StandardHeader";
import AppFooter from "@/components/AppFooter";
import { addWhiskey } from "@/lib/formatValidation";
// import { uiToApi, type ValidationPayload } from "../../../lib/validationSchema";

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
  meta?: {
    finish_reason: string;
    candidate_count: number;
    was_repaired: boolean;
  };
}

export default function ValidationMode() {
  const [, setLocation] = useLocation();
  const { questionLimit, refreshQuestionLimit } = useQuestionLimit();
  const [context, setContext] = useState("");
  const [relationship, setRelationship] = useState("friend");
  const [mode, setMode] = useState<"positive" | "negative" | "mixed">("positive");
  const [style, setStyle] = useState("moodybot");
  const [intensity, setIntensity] = useState([1]);
  const [length, setLength] = useState("short");
  const [reasonTags, setReasonTags] = useState<string[]>([]);
  const [includeFollowup, setIncludeFollowup] = useState(false);
  const [order, setOrder] = useState<"pos_neg" | "neg_pos">("pos_neg");
  const [response, setResponse] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<any>(null);

  const handleReasonTagToggle = (tag: string) => {
    setReasonTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Sanitizer to clean input text
  const sanitize = (s: string) =>
    s.replace(/[\u2022\-\*•▪►]/g, " ")   // bullets → space
     .replace(/\s+/g, " ")
     .trim();

  const handleGenerate = async (regenerateWithBiggerBudget?: boolean) => {
    if (!context.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // 🚀 IMPROVED MOCK RESPONSE - Remove when API key is set up
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate context-aware responses based on length setting
    const generateValidation = () => {
      // Extract key themes from context for more relevant responses
      const contextLower = context.toLowerCase();
      const themes = {
        family: contextLower.includes('family') || contextLower.includes('mom') || contextLower.includes('dad') || contextLower.includes('sister') || contextLower.includes('brother'),
        loss: contextLower.includes('passed') || contextLower.includes('died') || contextLower.includes('death') || contextLower.includes('dementia') || contextLower.includes('grief'),
        achievement: contextLower.includes('accomplish') || contextLower.includes('proud') || contextLower.includes('success') || contextLower.includes('led') || contextLower.includes('teams'),
        passion: contextLower.includes('dance') || contextLower.includes('love') || contextLower.includes('dream') || contextLower.includes('studio') || contextLower.includes('art'),
        growth: contextLower.includes('learn') || contextLower.includes('grow') || contextLower.includes('better') || contextLower.includes('years') || contextLower.includes('experience'),
        vulnerability: contextLower.includes('regret') || contextLower.includes('wish') || contextLower.includes('difficult') || contextLower.includes('struggle') || contextLower.includes('challenge'),
        faith: contextLower.includes('faith') || contextLower.includes('spiritual') || contextLower.includes('belief') || contextLower.includes('prayer'),
        leadership: contextLower.includes('lead') || contextLower.includes('team') || contextLower.includes('manage') || contextLower.includes('direct')
      };

      // Response pools based on themes, mode, and length
      const getResponses = () => {
        const baseResponses = {
          positive: {
            one_liner: [
              "You're showing up authentically in ways that matter 🥃",
              "That kind of self-awareness hits different 🥃", 
              "You're not just surviving, you're intentionally living 🥃",
              "Real recognizes real - and you're keeping it honest 🥃",
              "You carved something steady out of the chaos 🥃"
            ],
            short: [
              "You're navigating this with more grace than you probably give yourself credit for. The way you honor your experiences while still pushing forward shows real emotional intelligence 🥃",
              "There's something powerful about how you hold both gratitude and grief at the same time. That takes a kind of strength most people never develop 🥃",
              "You're building something meaningful from both your wins and your wounds. That's not just resilience - that's wisdom in action 🥃",
              "The way you process difficult experiences while staying open to growth is remarkable. You're not just getting through it - you're learning from it 🥃"
            ],
            paragraph: [
              "The way you talk about your experiences shows someone who's learned to hold complexity without letting it break you. You acknowledge loss and regret without letting them define you, and you celebrate achievements without losing sight of what really matters. That balance between honoring your past and building your future isn't something you stumble into - it's something you choose, again and again. The intentionality in how you approach relationships and personal growth speaks to someone who's done the work of understanding themselves 🥃",
              "What strikes me about everything you've shared is how you've learned to transform pain into purpose without bypassing the actual feeling of it. You don't just 'stay positive' - you stay present, which is infinitely more difficult and more valuable. The way you connect your personal losses to your current appreciation for time and relationships shows emotional maturity that most people spend decades trying to develop 🥃"
            ]
          },
          negative: {
            one_liner: [
              "Slow down. Pride is loud; proof is quiet 🥃",
              "Show me the process, not the outcome 🥃",
              "Proof beats posture, every time 🥃",
              "What's the system behind the success? 🥃"
            ],
            short: [
              "I see the excitement, but let's focus on what you can control. What's the next small step that actually moves the needle? 🥃",
              "Cool story. Now show me the repeatable process behind it. Proof beats posture, every time 🥃",
              "Current trajectory shows high variance. Recommend focusing on measurable, repeatable processes before claiming success 🥃"
            ],
            paragraph: [
              "The excitement is understandable, but sustainable success comes from systems, not just outcomes. What I'm not seeing is the repeatable process that got you here. High variance results can feel like progress, but they're actually just noise until you can identify the signal. The real work isn't in celebrating the win - it's in understanding exactly what created it so you can do it again, intentionally 🥃"
            ]
          },
          mixed: {
            one_liner: [
              "Credit where due: you moved the needle. Now make it repeatable 🥃",
              "Good move; now tighten the loop 🥃",
              "Win logged—now prove it wasn't a one-off 🥃"
            ],
            short: [
              "Good move; now tighten the loop. How will you replicate this success without relying on the same conditions? 🥃",
              "Win logged—now prove it wasn't a one-off. What's the copy-and-paste version of this process? 🥃",
              "Initial results promising. Next phase: systematize approach for consistent replication 🥃"
            ],
            paragraph: [
              "There's real progress here, and I want to acknowledge that before we get into what comes next. You've moved the needle in a meaningful way, but sustainable success isn't about hitting it once - it's about understanding exactly what created the win so you can replicate it. The question isn't whether you can do it again, but whether you can do it consistently, under different conditions, with the same level of intentionality 🥃"
            ]
          }
        };

        // Get responses based on mode and length
        const modeResponses = baseResponses[mode] || baseResponses.positive;
        const lengthKey = length === "one_liner" ? "one_liner" : 
                         length === "short" ? "short" : "paragraph";
        
        return modeResponses[lengthKey] || modeResponses.short;
      };

      // Add theme-specific responses
      const themeResponses = [];
      if (themes.family) {
        themeResponses.push("The way you honor family while building your own path shows real emotional maturity 🥃");
      }
      if (themes.faith) {
        themeResponses.push("Your faith isn't just belief - it's the foundation you've built your growth on 🥃");
      }
      if (themes.leadership) {
        themeResponses.push("Leading teams isn't just about managing people - it's about creating conditions for others to thrive 🥃");
      }
      if (themes.loss) {
        themeResponses.push("The way you carry loss while still moving forward takes a kind of courage most people never develop 🥃");
      }

      // Combine base responses with theme-specific ones
      const allResponses = [...getResponses(), ...themeResponses];
      return allResponses[Math.floor(Math.random() * allResponses.length)];
    };

    // Generate contextual "because" statements
    const generateBecause = () => {
      const becauseOptions = [
        "You're demonstrating the kind of emotional intelligence that comes from real experience",
        "You're showing up with both vulnerability and strength - that's rare",
        "The way you process difficult experiences while staying open to growth is remarkable",
        "You're honoring your experiences without letting them limit your future",
        "You're choosing intentionality over just going through the motions",
        "You've learned to hold complexity without letting it break you",
        "The balance between honoring your past and building your future isn't something you stumble into"
      ];
      return becauseOptions[Math.floor(Math.random() * becauseOptions.length)];
    };

    // Generate followup questions based on mode and context
    const generateFollowup = () => {
      if (!includeFollowup) return "";
      
      const followups = [
        "What's one thing you've learned about yourself that you didn't expect?",
        "How has your relationship with uncertainty changed over time?",
        "What would you tell someone going through something similar?",
        "What does 'living intentionally' actually look like in your daily life?",
        "How do you balance honoring the past while building the future?",
        "What's the smallest step you can take this week to build on this?",
        "If you had to teach someone else what you've learned, what would you tell them first?"
      ];
      return followups[Math.floor(Math.random() * followups.length)];
    };

    // Mock response with dynamic content
    const mockResponse = {
      validation: generateValidation(),
      because: generateBecause(),
      followup: generateFollowup(),
      meta: { 
        finish_reason: "complete",
        candidate_count: 1,
        was_repaired: false,
        mock: true,
        mode,
        style,
        intensity: intensity[0] === 0 ? "feather" : 
                   intensity[0] === 1 ? "casual" : 
                   intensity[0] === 2 ? "firm" : 
                   "heavy",
        length
      }
    };
    
    setResponse(mockResponse);
    setIsLoading(false);
    
    return; // Remove this line when using real server

    try {
      // Map UI controls to proper API contract
      const payload = {
        message: sanitize(context),
        relationship: relationship,
        mode: mode,
        style: style, // Server expects lowercase values: warm, blunt, playful, clinical, moodybot
        intensity: intensity[0] === 0 ? "feather" : 
                   intensity[0] === 1 ? "casual" : 
                   intensity[0] === 2 ? "firm" : 
                   "heavy",
        length: length === "one_liner" ? "1-line" : 
                length === "short" ? "2-3-lines" : 
                "short-paragraph",
        include_followup: includeFollowup,
        followup_style: "question" as const,
        tags: reasonTags,
        system_flavor: "validation" as const,
        version: "v1" as const,
      };

      // Debug logging to verify form state is wired correctly
      if (process.env.NODE_ENV === 'development') {
        console.groupCollapsed("VALIDATION → request payload");
        console.table(payload); // must show: relationship, mode, style, intensity, length, include_followup, tags
        console.groupEnd();
      }

      // Store the request for potential regeneration
      setLastRequest(payload);
      
      // Line-count guard for development
      const assertLength = (text: string, length: "1-line"|"2-3-lines"|"short-paragraph") => {
        const lines = text.trim().split(/\n+/);
        if (length === "1-line" && lines.length !== 1) {
          console.error("Length fail: 1-line", { text, lines: lines.length });
          throw new Error("Length fail: 1-line");
        }
        if (length === "2-3-lines" && lines.length > 3) {
          console.error("Length fail: 2-3-lines", { text, lines: lines.length });
          throw new Error("Length fail: 2-3-lines");
        }
        if (length === "short-paragraph" && lines.length !== 1) {
          console.error("Length fail: short-paragraph", { text, lines: lines.length });
          throw new Error("Length fail: short-paragraph");
        }
      };

      const res = await fetch('http://localhost:10000/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store' // Cache control as fetch option, not in JSON body
      });

      if (!res.ok) {
        const text = await res.text();         // always read the body once
        let json: any = null;
        try { json = JSON.parse(text); } catch {}
        throw new Error(
          `HTTP ${res.status} :: ${json?.error ?? "Unknown"} :: ${JSON.stringify(json ?? text)}`
        );
      }

      const json = await res.json();
      
      if (!json?.text) {
        throw new Error(json?.error || `No response text received`);
      }

      // Use the richer response from the new API
      const formattedOutput = {
        validation: json.text || "",  // Already includes 🥃 from server
        because: json.because || "You shared something meaningful with me.",
        push_pull: "",
        followup: json.followup || "",
        meta: json.meta
      };
      
      // Assert length compliance in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const validLengths = ["1-line", "2-3-lines", "short-paragraph"] as const;
          if (validLengths.includes(payload.length as any)) {
            assertLength(formattedOutput.validation, payload.length as "1-line"|"2-3-lines"|"short-paragraph");
          }
        } catch (e) {
          console.warn("Length assertion failed:", e);
        }
      }
      
      setResponse(formattedOutput);
      
      // Refresh question limit after successful request
      if (json.remaining !== undefined) {
        refreshQuestionLimit(1); // Default user ID for now
      }
    } catch (error: any) {
      console.error('Error generating validation:', error);
      
      // Show error without whiskey suffix
      setResponse({
        validation: "",
        because: "",
        push_pull: "",
        followup: ""
      });
      setError(error?.message ?? "Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    // Use the already formatted response fields
    const text = [response.validation, response.because, response.push_pull, response.followup]
      .filter(Boolean)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleRegenerate = () => {
    handleGenerate(false);
  };

  const handleRegenerateWithBiggerBudget = () => {
    handleGenerate(true);
  };

  const isWorkplace = relationship === "coworker" || relationship === "client";
  const maxIntensity = isWorkplace ? 2 : 3;

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1C1C1C 100%)' }}>
      {/* Standard Header */}
      <StandardHeader modeLabel="VALIDATION MODE" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Question Limit Display */}
        {questionLimit && (
          <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
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
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                  >
                    Subscribe $9/month
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Section */}
        <Card className="border-0 shadow-2xl" style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
          <CardHeader>
            <CardTitle className="text-white">Generate Validation Response</CardTitle>
            <CardDescription className="text-gray-300">
              Create emotionally intelligent responses that validate feelings and behaviors
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
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
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
                        ? "bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600 text-white" 
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
                        ? "bg-gradient-to-r from-teal-500 to-violet-500 text-white" 
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
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                    >
                      + → –
                    </TabsTrigger>
                    <TabsTrigger 
                      value="neg_pos"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                    >
                      – → +
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={() => handleGenerate()}
              disabled={!context.trim() || isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
            <Card className="border-0 shadow-2xl" style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
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
                      onClick={() => handleRegenerate()}
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
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <h4 className="font-semibold text-sm text-red-400 mb-2">Error</h4>
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                {/* Validation Response */}
                {response && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    mode === 'positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
                    mode === 'negative' ? 'border-l-amber-500 bg-amber-500/10' :
                    'border-l-teal-500 bg-gradient-to-r from-teal-500/10 to-amber-500/10'
                  }`}>
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation</h4>
                    <p className="text-white text-lg" data-testid="validation-output">{response.validation}</p>
                  </div>

                  {/* Only show "because" if it's not an engine reason */}
                  {response.because && !/fallback triggered|length cutoff|json/i.test(response.because) && (
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-600">
                      <h4 className="font-semibold text-sm text-gray-300 mb-2 italic">Because</h4>
                      <p className="text-white italic">{response.because}</p>
                    </div>
                  )}

                  {response.push_pull && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                      mode === 'positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
                      mode === 'negative' ? 'border-l-amber-500 bg-amber-500/10' :
                      'border-l-teal-500 bg-gradient-to-r from-teal-500/10 to-amber-500/10'
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

                  {/* Regenerate with bigger budget option for length cutoffs */}
                  {response.meta?.finish_reason === "length" && (
                    <div className="pt-4 border-t border-gray-600">
                      <button 
                        className="text-xs opacity-70 hover:opacity-100 underline text-gray-300 hover:text-white transition-opacity"
                        onClick={handleRegenerateWithBiggerBudget}
                        disabled={isLoading}
                      >
                        Regenerate with bigger budget
                      </button>
                    </div>
                  )}
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Standard Footer */}
      <AppFooter />
    </div>
  );
}
