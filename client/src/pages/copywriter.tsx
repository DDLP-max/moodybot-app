"use client";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, Sparkles, Target, Zap, MessageSquare, MousePointer } from "lucide-react";

interface CopyOutput {
  titles: string[];
  hooks: string[];
  ctas: string[];
  captions: string[];
}

export default function CopywriterPage() {
  const [, setLocation] = useLocation();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<CopyOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [questionLimit, setQuestionLimit] = useState<{ remaining: number; limit: number } | null>(null);

  async function handleGenerate() {
    console.log("clicked"); // sanity ping
    setErr(null);
    if (!description.trim()) { 
      setErr("Add a business description."); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/copywriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, userId: 1 }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Request failed");
      
      // Check if limit reached
      if (data.limitReached) {
        setOut(null);
        setErr("Limit reached. Please subscribe for unlimited access.");
      } else {
        setOut(data.result);
        // Update question limit
        if (data.remaining !== undefined && data.limit !== undefined) {
          setQuestionLimit({
            remaining: data.remaining,
            limit: data.limit
          });
        }
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
              <Target className="text-green-500 text-xl" />
              <span className="font-black text-lg">Copywriter Mode</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="text-green-500 h-5 w-5" />
            <span className="text-sm text-muted-foreground">Powered by Grok-4</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent">
            Copywriter Mode
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Generate killer marketing copy with the Ogilvy module
          </p>
          <p className="text-sm text-muted-foreground">
            Titles • Hooks • CTAs • Captions • Social Media Copy
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
                      {questionLimit.remaining} of {questionLimit.limit} copywriting requests remaining
                    </p>
                    {questionLimit.remaining <= 1 && questionLimit.remaining > 0 && (
                      <p className="text-xs text-orange-500 mt-1">
                        Last free request! Subscribe for unlimited access.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    3 of 3 copywriting requests remaining
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

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <span>Business Description</span>
            </CardTitle>
            <CardDescription>
              Describe your business, product, or service. Be specific about your target audience and what makes you unique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Example: We're a premium coffee subscription service targeting busy professionals aged 25-40 who appreciate quality and convenience. We source single-origin beans from sustainable farms and deliver fresh-roasted coffee weekly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              >
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating Copy...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {err && (
          <Card className="mb-6 bg-red-900/20 border-red-500/30">
            <CardContent className="pt-6">
              <p className="text-red-400 text-center">{err}</p>
            </CardContent>
          </Card>
        )}

        {/* Output Section */}
        {out && (
          <div className="space-y-6">
            {/* Titles */}
            {out.titles && out.titles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Headlines & Titles</span>
                  </CardTitle>
                  <CardDescription>
                    Compelling headlines that grab attention and communicate value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {out.titles.map((title: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(title)}
                          className="hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hooks */}
            {out.hooks && out.hooks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>Hooks & Openers</span>
                  </CardTitle>
                  <CardDescription>
                    Attention-grabbing opening lines that pull readers in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {out.hooks.map((hook: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{hook}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(hook)}
                          className="hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTAs */}
            {out.ctas && out.ctas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MousePointer className="h-5 w-5 text-primary" />
                    <span>Call-to-Actions</span>
                  </CardTitle>
                  <CardDescription>
                    Compelling CTAs that drive action and conversions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {out.ctas.map((cta: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{cta}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(cta)}
                          className="hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Captions */}
            {out.captions && out.captions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>Social Media Captions</span>
                  </CardTitle>
                  <CardDescription>
                    Engaging captions for social media posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {out.captions.map((caption: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{caption}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(caption)}
                          className="hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-center">💡 Copywriting Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🎯 Be Specific</h4>
                  <p className="text-muted-foreground">
                    Include your target audience, unique benefits, and specific pain points you solve.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🔥 Create Urgency</h4>
                  <p className="text-muted-foreground">
                    Use time-sensitive language and scarcity to drive immediate action.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">💪 Focus on Benefits</h4>
                  <p className="text-muted-foreground">
                    Don't just list features - explain how they make your customer's life better.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🎭 Test & Iterate</h4>
                  <p className="text-muted-foreground">
                    Try different versions and track which ones perform best with your audience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
