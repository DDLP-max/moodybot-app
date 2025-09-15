import crypto from "crypto";

function pick<T>(arr: T[], seed: string) {
  const h = crypto.createHash('sha256').update(seed).digest()[0];
  return arr[h % arr.length];
}

export function moodyFallback(payload: {
  mode: "positive" | "negative" | "mixed",
  length: "one" | "two_three" | "short_para",
  intensity: "feather" | "casual" | "firm" | "heavy",
  style: "moodybot" | "plain",
  reasonTags?: string[],
  includeFollowup?: boolean,
  userMsg: string
}) {
  const seeds = payload.userMsg.slice(0, 80) + "|" + payload.mode + "|" + payload.length + "|" + payload.intensity;

  const pos = [
    "You carved something steady out of the chaos.",
    "That wasn't luck. That was you swinging with intent.",
    "You turned intent into process. Keep running it.",
    "You fought gravity, bent the day your way.",
    "Most people drift, you aimed. That's why it hit."
  ];
  const mix = [
    "Good move; now tighten the loop.",
    "Solid step; systemize it next.",
    "You're building rhythm people can't ignore.",
    "Sharp edge, steady hand. Keep it coming.",
    "That's the kind of foundation you can build on."
  ];
  const neg = [
    "Less confetti, more cadence.",
    "Brag later. Build the loop now.",
    "Proof beats posture. Ship the next rep.",
    "Cut through the static. Make it stick.",
    "Stop selling the sizzle. Cook the steak."
  ];
  const bank = payload.mode === "positive" ? pos : payload.mode === "mixed" ? mix : neg;

  const opener = pick(bank, seeds);
  const tail = payload.reasonTags?.length ? ` This touches ${payload.reasonTags.slice(0,3).join(", ")}.` : "";

  const follow = payload.includeFollowup
    ? pick([
        "What's the smallest step you can repeat twice this week?",
        "Name the one lever you can pull again by Friday.",
        "If this worked once, what's the copy-and-paste version?",
        "What's your next move in this rhythm?",
        "How do you bottle this lightning?"
      ], seeds)
    : "";

  const lines = {
    one: () => `${opener}${tail} 🥃`,
    two_three: () => `${opener} ${pick(bank.filter(l=>l!==opener).concat(["Bank it, rerun it."]), seeds)}${tail} 🥃`,
    short_para: () => `${opener} ${pick(bank.filter(l=>l!==opener), seeds)}${tail} ${follow ? ("\n\n" + follow) : ""} 🥃`
  }[payload.length]();

  return {
    validation: lines,
    followup: payload.includeFollowup ? follow : undefined,
    tags: [payload.mode, payload.intensity, payload.length, ...(payload.reasonTags?.slice(0,3) || [])]
  };
}

// Helper to map API length values to fallback length values with stylistic roles
export function mapLengthToFallback(length: string): "one" | "two_three" | "short_para" {
  switch (length) {
    case "1-liner":
      return "one"; // Shot glass
    case "2-3 lines":
      return "two_three"; // Pint
    case "short":
    case "medium":
    case "long":
    default:
      return "short_para"; // Bottle
  }
}

// Helper to map API intensity values to fallback intensity values
export function mapIntensityToFallback(intensity: number): "feather" | "casual" | "firm" | "heavy" {
  if (intensity <= 1) return "feather";
  if (intensity <= 2) return "casual";
  if (intensity <= 3) return "firm";
  return "heavy";
}
