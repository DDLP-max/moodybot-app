export function sanitizeInput(input: string): string {
  if (!input) return "";

  // 1. Add a space after periods if followed directly by the whiskey glass emoji (do this first before emoji removal)
  let sanitized = input.replace(/\.🥃/g, ". 🥃");

  // 2. Remove emojis (covers most ranges)
  sanitized = sanitized.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uFE0F)/g,
    ""
  );

  // 3. Remove bullet characters but preserve spacing
  sanitized = sanitized.replace(/[•\-\*]/g, " ");

  // 4. Trim extra whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}
