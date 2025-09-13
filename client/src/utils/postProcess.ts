export function postProcessValidation(output: string): string {
  if (!output) return "";

  let out = output.trim();

  // Ensure ". 🥃" spacing
  out = out.replace(/\.🥃/g, ". 🥃");

  // Cap to ~3 lines by sentence-ish boundaries
  const sentences = out
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3);
  out = sentences.join(" ").trim();

  // Convert to 2–3 short lines (insert soft breaks if very long)
  // Simple heuristic: split on natural commas to keep 2–3 lines.
  const chunks: string[] = [];
  let carry = "";
  for (const part of out.split(/,\s+/)) {
    const next = carry ? `${carry}, ${part}` : part;
    if (next.length > 110 && carry) {
      chunks.push(carry);
      carry = part;
    } else {
      carry = next;
    }
  }
  if (carry) chunks.push(carry);

  // Keep max 3 lines
  out = chunks.slice(0, 3).join("\n");

  return out.trim();
}
