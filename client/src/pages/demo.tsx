import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { dynamicPersonaEngine, type PersonaAnalysis } from "@/lib/dynamicPersonaEngine";

export default function Demo() {
  const [, setLocation] = useLocation();
  const [userInput, setUserInput] = useState("");
  const [analysis, setAnalysis] = useState<PersonaAnalysis | null>(null);

  const handleAnalyze = () => {
    if (!userInput.trim()) return;
    
    const result = dynamicPersonaEngine.analyzeUserInput(userInput);
    setAnalysis(result);
  };

  const testInputs = [
    "I feel like I'm starting to spiral again. Everything feels overwhelming and I don't know what to do.",
    "Why do I always ruin everything? Every time I get close to something good, I find a way to mess it up.",
    "I'm so tired of people telling me what to do. I know what's best for me.",
    "I think the problem is that we're approaching this from the wrong angle. Let me analyze the situation.",
    "I miss them so much. They're never coming back and I don't know how to move on.",
    "I'm the smartest person in every room but still get left behind. What's wrong with this world?",
    "I can't stop overthinking everything. My mind just won't shut off and I'm exhausted from it."
  ];

  const getEmotionalColor = (score: number) => {
    if (score === 0) return "bg-gray-100 text-gray-600";
    if (score <= 2) return "bg-blue-100 text-blue-600";
    if (score <= 4) return "bg-yellow-100 text-yellow-600";
    return "bg-red-100 text-red-600";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="text-blue-500 text-xl" />
            <span className="font-black text-xl">Dynamic Persona Engine Demo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span>Test Input</span>
                </CardTitle>
                <CardDescription>
                  Enter text to see how the dynamic persona engine analyzes emotional content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Type your message here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAnalyze();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleAnalyze}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    disabled={!userInput.trim()}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </div>

                {/* Quick Test Buttons */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Quick Test Examples:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {testInputs.map((input, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUserInput(input);
                          setAnalysis(dynamicPersonaEngine.analyzeUserInput(input));
                        }}
                        className="text-left justify-start h-auto p-2 text-xs"
                      >
                        {input.substring(0, 50)}...
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            {analysis ? (
              <>
                {/* Persona Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <span>Selected Personas</span>
                    </CardTitle>
                    <CardDescription>
                      AI-selected persona stack based on emotional analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-500 text-white">
                        Primary: {analysis.selectedPersonas.primary.name}
                      </Badge>
                      {analysis.selectedPersonas.secondary && (
                        <>
                          <span className="text-muted-foreground">+</span>
                          <Badge variant="secondary">
                            {analysis.selectedPersonas.secondary.name}
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence:</span>
                        <Badge className={getEmotionalColor(Math.round(analysis.confidence * 10))}>
                          {Math.round(analysis.confidence * 100)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {analysis.reasoning}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emotional State Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emotional State Analysis</CardTitle>
                    <CardDescription>
                      Detailed breakdown of detected emotional indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Vulnerability</span>
                          <Badge className={getEmotionalColor(analysis.emotionalState.vulnerability)}>
                            {analysis.emotionalState.vulnerability}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Defensiveness</span>
                          <Badge className={getEmotionalColor(analysis.emotionalState.defensiveness)}>
                            {analysis.emotionalState.defensiveness}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Validation Seeking</span>
                          <Badge className={getEmotionalColor(analysis.emotionalState.validationSeeking)}>
                            {analysis.emotionalState.validationSeeking}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Ego Collapse</span>
                          <Badge className={getEmotionalColor(analysis.emotionalState.egoCollapse)}>
                            {analysis.emotionalState.egoCollapse}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Intellectual</span>
                          <Badge className={getEmotionalColor(analysis.emotionalState.intellectualPosturing)}>
                            {analysis.emotionalState.intellectualPosturing}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Content Type</span>
                          <Badge variant="outline" className="capitalize">
                            {analysis.emotionalState.contentType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tone:</span>
                        <Badge variant="outline" className="capitalize">
                          {analysis.emotionalState.tone}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Enter text above to see persona analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Dynamic Persona Selection Works</CardTitle>
            <CardDescription>
              The AI analyzes your message content and emotional indicators to automatically select the most appropriate persona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">1. Emotional Detection</h4>
                <p className="text-muted-foreground">
                  Analyzes keywords, tone, and content type to identify emotional state
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">2. Persona Selection</h4>
                <p className="text-muted-foreground">
                  Matches emotional state to optimal persona combinations using compatibility matrix
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">3. Adaptive Response</h4>
                <p className="text-muted-foreground">
                  MoodyBot responds using the selected persona stack for optimal emotional resonance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

