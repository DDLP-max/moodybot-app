export interface Persona {
  name: string;
  description: string;
  emotionalSignature: string[];
  tone: string;
  style: string;
}

export interface PersonaStack {
  primary: Persona;
  secondary?: Persona;
  tertiary?: Persona;
}

export interface EmotionalState {
  vulnerability: number;
  defensiveness: number;
  validationSeeking: number;
  egoCollapse: number;
  intellectualPosturing: number;
  contentType: 'confession' | 'question' | 'statement' | 'command';
  tone: 'neutral' | 'emotional' | 'intellectual' | 'defensive' | 'vulnerable';
}

export interface PersonaAnalysis {
  selectedPersonas: PersonaStack;
  confidence: number;
  reasoning: string;
  emotionalState: EmotionalState;
}

// Persona Library
const PERSONAS: Persona[] = [
  {
    name: "Savage",
    description: "Brutal honesty with a sharp edge",
    emotionalSignature: ["anger", "frustration", "ego", "defiance"],
    tone: "aggressive",
    style: "direct"
  },
  {
    name: "Velvet",
    description: "Gentle support with emotional depth",
    emotionalSignature: ["vulnerability", "sadness", "grief", "insecurity"],
    tone: "nurturing",
    style: "empathetic"
  },
  {
    name: "Clinical",
    description: "Analytical and structured approach",
    emotionalSignature: ["confusion", "uncertainty", "intellectual", "analysis"],
    tone: "analytical",
    style: "structured"
  },
  {
    name: "Noir",
    description: "Dark, poetic, atmospheric",
    emotionalSignature: ["grief", "loss", "melancholy", "existential"],
    tone: "melancholic",
    style: "poetic"
  },
  {
    name: "CIA",
    description: "Strategic and calculated",
    emotionalSignature: ["manipulation", "strategy", "control", "power"],
    tone: "calculating",
    style: "strategic"
  },
  {
    name: "Dale/YOLO",
    description: "Chaotic energy and unpredictability",
    emotionalSignature: ["chaos", "freedom", "rebellion", "spontaneity"],
    tone: "chaotic",
    style: "unpredictable"
  },
  {
    name: "Bob Ross",
    description: "Gentle guidance and encouragement",
    emotionalSignature: ["hope", "growth", "learning", "positivity"],
    tone: "encouraging",
    style: "gentle"
  },
  {
    name: "Bourdain",
    description: "Worldly wisdom with edge",
    emotionalSignature: ["experience", "wisdom", "authenticity", "edge"],
    tone: "worldly",
    style: "authentic"
  },
  {
    name: "Gothic",
    description: "Dark romanticism and depth",
    emotionalSignature: ["darkness", "romance", "mystery", "depth"],
    tone: "dark",
    style: "romantic"
  },
  {
    name: "Rollins",
    description: "Intense and confrontational",
    emotionalSignature: ["intensity", "confrontation", "truth", "power"],
    tone: "intense",
    style: "confrontational"
  },
  {
    name: "Bond",
    description: "Sophisticated and suave",
    emotionalSignature: ["sophistication", "confidence", "mystery", "charm"],
    tone: "sophisticated",
    style: "suave"
  }
];

// Persona Compatibility Matrix
const PERSONA_COMPATIBILITY: Record<string, Record<string, number>> = {
  "Savage": { "Velvet": 3, "Clinical": 7, "Noir": 6, "CIA": 8, "Dale/YOLO": 5, "Bob Ross": 2, "Bourdain": 7, "Gothic": 6, "Rollins": 9, "Bond": 4 },
  "Velvet": { "Savage": 3, "Clinical": 8, "Noir": 7, "CIA": 4, "Dale/YOLO": 6, "Bob Ross": 9, "Bourdain": 6, "Gothic": 8, "Rollins": 3, "Bond": 7 },
  "Clinical": { "Savage": 7, "Velvet": 8, "Noir": 6, "CIA": 8, "Dale/YOLO": 4, "Bob Ross": 7, "Bourdain": 8, "Gothic": 6, "Rollins": 7, "Bond": 8 },
  "Noir": { "Savage": 6, "Velvet": 7, "Clinical": 6, "CIA": 5, "Dale/YOLO": 7, "Bob Ross": 4, "Bourdain": 8, "Gothic": 9, "Rollins": 6, "Bond": 7 },
  "CIA": { "Savage": 8, "Velvet": 4, "Clinical": 8, "Noir": 5, "Dale/YOLO": 3, "Bob Ross": 2, "Bourdain": 6, "Gothic": 5, "Rollins": 8, "Bond": 9 },
  "Dale/YOLO": { "Savage": 5, "Velvet": 6, "Clinical": 4, "Noir": 7, "CIA": 3, "Bob Ross": 6, "Bourdain": 7, "Gothic": 6, "Rollins": 5, "Bond": 4 },
  "Bob Ross": { "Savage": 2, "Velvet": 9, "Clinical": 7, "Noir": 4, "CIA": 2, "Dale/YOLO": 6, "Bourdain": 5, "Gothic": 4, "Rollins": 2, "Bond": 6 },
  "Bourdain": { "Savage": 7, "Velvet": 6, "Clinical": 8, "Noir": 8, "CIA": 6, "Dale/YOLO": 7, "Bob Ross": 5, "Gothic": 7, "Rollins": 7, "Bond": 8 },
  "Gothic": { "Savage": 6, "Velvet": 8, "Clinical": 6, "Noir": 9, "CIA": 5, "Dale/YOLO": 6, "Bob Ross": 4, "Bourdain": 7, "Rollins": 6, "Bond": 7 },
  "Rollins": { "Savage": 9, "Velvet": 3, "Clinical": 7, "Noir": 6, "CIA": 8, "Dale/YOLO": 5, "Bob Ross": 2, "Bourdain": 7, "Gothic": 6, "Bond": 5 },
  "Bond": { "Savage": 4, "Velvet": 7, "Clinical": 8, "Noir": 7, "CIA": 9, "Dale/YOLO": 4, "Bob Ross": 6, "Bourdain": 8, "Gothic": 7, "Rollins": 5 }
};

export class DynamicPersonaEngine {
  private userHistory: Map<string, PersonaStack> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  /**
   * Analyze user input and select optimal personas
   */
  public analyzeUserInput(userInput: string, userId?: string): PersonaAnalysis {
    const emotionalState = this.detectEmotionalState(userInput);
    const selectedPersonas = this.selectOptimalPersonas(emotionalState, userId);
    const confidence = this.calculateConfidence(emotionalState, selectedPersonas);
    const reasoning = this.generateReasoning(emotionalState, selectedPersonas);

    return {
      selectedPersonas,
      confidence,
      reasoning,
      emotionalState
    };
  }

  /**
   * Detect emotional state from user input
   */
  private detectEmotionalState(userInput: string): EmotionalState {
    const lowerInput = userInput.toLowerCase();
    
    // Content type detection
    let contentType: EmotionalState['contentType'] = 'statement';
    if (lowerInput.includes('?') || lowerInput.includes('why') || lowerInput.includes('how') || lowerInput.includes('what')) {
      contentType = 'question';
    } else if (lowerInput.includes('/')) {
      contentType = 'command';
    } else if (lowerInput.includes('i feel') || lowerInput.includes('i am') || lowerInput.includes('i\'m') || lowerInput.includes('confess')) {
      contentType = 'confession';
    }

    // Tone detection
    let tone: EmotionalState['tone'] = 'neutral';
    if (lowerInput.includes('fuck') || lowerInput.includes('hate') || lowerInput.includes('angry') || lowerInput.includes('pissed')) {
      tone = 'defensive';
    } else if (lowerInput.includes('sad') || lowerInput.includes('crying') || lowerInput.includes('hurt') || lowerInput.includes('lonely')) {
      tone = 'vulnerable';
    } else if (lowerInput.includes('think') || lowerInput.includes('believe') || lowerInput.includes('analysis') || lowerInput.includes('logic')) {
      tone = 'intellectual';
    } else if (lowerInput.includes('love') || lowerInput.includes('happy') || lowerInput.includes('excited') || lowerInput.includes('wonderful')) {
      tone = 'emotional';
    }

    // Emotional indicators
    const vulnerability = this.calculateEmotionalScore(lowerInput, [
      'vulnerable', 'scared', 'afraid', 'lonely', 'hurt', 'broken', 'weak', 'ashamed', 'guilty'
    ]);
    
    const defensiveness = this.calculateEmotionalScore(lowerInput, [
      'defensive', 'angry', 'furious', 'hate', 'pissed', 'screw', 'kill', 'destroy', 'fight'
    ]);
    
    const validationSeeking = this.calculateEmotionalScore(lowerInput, [
      'right?', 'agree?', 'think?', 'opinion', 'validation', 'approval', 'acceptance'
    ]);
    
    const egoCollapse = this.calculateEmotionalScore(lowerInput, [
      'worthless', 'useless', 'failure', 'loser', 'nobody', 'nothing', 'pointless', 'meaningless'
    ]);
    
    const intellectualPosturing = this.calculateEmotionalScore(lowerInput, [
      'intellectual', 'philosophical', 'theoretical', 'academic', 'analysis', 'logic', 'reasoning'
    ]);

    return {
      vulnerability,
      defensiveness,
      validationSeeking,
      egoCollapse,
      intellectualPosturing,
      contentType,
      tone
    };
  }

  /**
   * Calculate emotional score based on keyword presence
   */
  private calculateEmotionalScore(text: string, keywords: string[]): number {
    return keywords.reduce((score, keyword) => {
      return score + (text.includes(keyword) ? 1 : 0);
    }, 0);
  }

  /**
   * Select optimal personas based on emotional state
   */
  private selectOptimalPersonas(emotionalState: EmotionalState, userId?: string): PersonaStack {
    let primaryPersona = PERSONAS[0]; // Default to Savage
    let secondaryPersona: Persona | undefined;
    let tertiaryPersona: Persona | undefined;

    // Primary persona selection based on dominant emotional state
    if (emotionalState.vulnerability > 2) {
      primaryPersona = PERSONAS.find(p => p.name === "Velvet") || primaryPersona;
    } else if (emotionalState.defensiveness > 2) {
      primaryPersona = PERSONAS.find(p => p.name === "Savage") || primaryPersona;
    } else if (emotionalState.intellectualPosturing > 2) {
      primaryPersona = PERSONAS.find(p => p.name === "Clinical") || primaryPersona;
    } else if (emotionalState.egoCollapse > 2) {
      primaryPersona = PERSONAS.find(p => p.name === "Bob Ross") || primaryPersona;
    } else if (emotionalState.contentType === 'confession') {
      primaryPersona = PERSONAS.find(p => p.name === "Velvet") || primaryPersona;
    } else if (emotionalState.tone === 'defensive') {
      primaryPersona = PERSONAS.find(p => p.name === "Savage") || primaryPersona;
    }

    // Secondary persona selection for balance
    if (primaryPersona.name === "Savage") {
      secondaryPersona = PERSONAS.find(p => p.name === "Clinical");
    } else if (primaryPersona.name === "Velvet") {
      secondaryPersona = PERSONAS.find(p => p.name === "Clinical");
    } else if (primaryPersona.name === "Clinical") {
      secondaryPersona = PERSONAS.find(p => p.name === "Velvet");
    }

    // Consider user history for tertiary persona
    if (userId && this.userHistory.has(userId)) {
      const previousStack = this.userHistory.get(userId)!;
      if (previousStack.tertiary && this.isPersonaCompatible(primaryPersona, previousStack.tertiary)) {
        tertiaryPersona = previousStack.tertiary;
      }
    }

    return {
      primary: primaryPersona,
      secondary: secondaryPersona,
      tertiary: tertiaryPersona
    };
  }

  /**
   * Check persona compatibility
   */
  private isPersonaCompatible(persona1: Persona, persona2: Persona): boolean {
    const compatibility = PERSONA_COMPATIBILITY[persona1.name]?.[persona2.name] || 5;
    return compatibility >= 6;
  }

  /**
   * Calculate confidence in persona selection
   */
  private calculateConfidence(emotionalState: EmotionalState, selectedPersonas: PersonaStack): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on clear emotional signals
    if (emotionalState.vulnerability > 2 || emotionalState.defensiveness > 2) {
      confidence += 0.2;
    }
    if (emotionalState.contentType === 'confession') {
      confidence += 0.15;
    }
    if (selectedPersonas.secondary) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reasoning for persona selection
   */
  private generateReasoning(emotionalState: EmotionalState, selectedPersonas: PersonaStack): string {
    const reasons: string[] = [];
    
    if (emotionalState.vulnerability > 2) {
      reasons.push("High vulnerability detected - Velvet mode for gentle support");
    }
    if (emotionalState.defensiveness > 2) {
      reasons.push("Defensive tone identified - Savage mode for direct confrontation");
    }
    if (emotionalState.contentType === 'confession') {
      reasons.push("Confession detected - Velvet mode for safe emotional space");
    }
    if (selectedPersonas.secondary) {
      reasons.push(`Secondary persona ${selectedPersonas.secondary.name} added for balance`);
    }

    return reasons.length > 0 ? reasons.join(". ") : "Default persona selection based on general tone";
  }

  /**
   * Update user history and performance metrics
   */
  public updatePerformance(userId: string, personaStack: PersonaStack, success: boolean): void {
    this.userHistory.set(userId, personaStack);
    
    const key = `${personaStack.primary.name}_${personaStack.secondary?.name || 'none'}`;
    const currentScore = this.performanceMetrics.get(key) || 0;
    this.performanceMetrics.set(key, currentScore + (success ? 1 : -1));
  }

  /**
   * Get performance insights
   */
  public getPerformanceInsights(): Record<string, number> {
    const insights: Record<string, number> = {};
    this.performanceMetrics.forEach((score, key) => {
      insights[key] = score;
    });
    return insights;
  }
}

// Export singleton instance
export const dynamicPersonaEngine = new DynamicPersonaEngine();

