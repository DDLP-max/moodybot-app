export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Remove emojis (common ranges) and variation selectors
  let out = input.replace(
    /([\u2700-\u27BF]|\uFE0F|[\uE000-\uF8FF]|[\uD83C-\uDBFF][\uDC00-\uDFFF])/g,
    ""
  );

  // Remove bullet chars but preserve spacing
  out = out.replace(/[•\-\*]+/g, " ");

  // Normalize whitespace
  out = out.replace(/\s+/g, " ").trim();

  return out;
}
