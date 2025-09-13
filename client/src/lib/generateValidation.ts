import { VALIDATION_SYSTEM_PROMPT } from "@/utils/validationPrompt";
import { sanitizeInput } from "@/utils/sanitizeInput";
import { postProcessValidation } from "@/utils/postProcess";

type GenOpts = {
  model?: string; // default below
  apiKey?: string; // if not using server env
};

export async function generateValidation(
  rawInput: string,
  opts: GenOpts = {}
): Promise<string> {
  const input = sanitizeInput(rawInput);
  if (!input) return "I'm hearing something hard to name. Try a simple sentence about how it feels.";

  const model = opts.model ?? "openrouter/grok-4"; // or your preferred model
  const apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY;

  const messages = [
    { role: "system", content: VALIDATION_SYSTEM_PROMPT },
    {
      role: "user",
      content:
        "Context:\n" +
        "You are validating a short confession or situation from a friend. Keep it warm and authored.\n\n" +
        `User text:\n"${input}"\n\n` +
        "Write a 2–3 line validation that follows the ritual."
    }
  ];

  // DEBUG: inspect exactly what goes to the model
  // (keep while testing; remove in production)
  // eslint-disable-next-line no-console
  console.log("[validation] payload preview:", { model, messages });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://app.moodybot.ai",
      "X-Title": "MoodyBot Validation"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 220
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const raw = json?.choices?.[0]?.message?.content?.trim() ?? "";
  return postProcessValidation(raw);
}
