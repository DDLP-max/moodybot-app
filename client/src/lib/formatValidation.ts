export function addWhiskey(text: string): string {
  const cleaned = text.trim().replace(/\s+🥃$/, "");
  return `${cleaned} 🥃`;
}
