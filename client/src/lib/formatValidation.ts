export function formatValidationResponse(text: string): string {
  const cleaned = text.trim().replace(/\s+🥃$/, ""); // strip any existing whiskey w/ spaces
  return `${cleaned} 🥃`;
}
