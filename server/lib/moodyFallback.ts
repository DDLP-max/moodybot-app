export function moodyFallback(payload: {
  mode: "positive" | "negative" | "mixed",
  length: "one" | "two_three" | "short_para",
  intensity: "feather" | "casual" | "firm" | "heavy",
  style: "moodybot" | "plain",
  reasonTags?: string[],
  includeFollowup?: boolean,
  userMsg: string
}) {
  const tone = {
    feather: ["soft", "warm"],
    casual: ["easy", "straight"],
    firm:   ["steady", "clear"],
    heavy:  ["direct", "no-sugar"]
  }[payload.intensity];

  const tagHook = (payload.reasonTags?.length ? ` This is about ${payload.reasonTags.slice(0,3).join(", ")}.` : "");
  
  const core = {
    positive: [
      "You didn't get lucky. You got serious and it shows.",
      "That wasn't noise. That was signal. Repeatable, earned."
    ],
    negative: [
      "Slow down. Pride is loud; proof is quiet.",
      "You're selling the sizzle before the steak's even warm."
    ],
    mixed: [
      "Credit where due: you moved the needle. Now make it repeatable.",
      "Win logged. Now do it without the victory dance."
    ]
  }[payload.mode];

  const follow = payload.includeFollowup
    ? "What would 'repeatable' look like this week? One action you can execute twice." 
    : "";

  // length shaping
  const build = {
    one:    () => `${core[0]}${tagHook} 🥃`,
    two_three: () => `${core[0]} ${core[1]}${tagHook} 🥃`,
    short_para: () => `${core[0]} ${core[1]}${tagHook} ${follow ? ("\n\n" + follow) : ""} 🥃`,
  }[payload.length];

  return {
    tags: [payload.mode, payload.style, payload.intensity, payload.length],
    validation: build(),
    because: undefined, // do NOT surface engine reasons in UI
    followup: payload.includeFollowup ? follow : undefined
  };
}

// Helper to map API length values to fallback length values
export function mapLengthToFallback(length: string): "one" | "two_three" | "short_para" {
  switch (length) {
    case "1-liner":
      return "one";
    case "2-3 lines":
      return "two_three";
    case "short":
    case "medium":
    case "long":
    default:
      return "short_para";
  }
}

// Helper to map API intensity values to fallback intensity values
export function mapIntensityToFallback(intensity: number): "feather" | "casual" | "firm" | "heavy" {
  if (intensity <= 1) return "feather";
  if (intensity <= 2) return "casual";
  if (intensity <= 3) return "firm";
  return "heavy";
}
