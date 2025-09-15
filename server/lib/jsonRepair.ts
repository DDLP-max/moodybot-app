// JSON repair utilities for handling malformed AI responses
export function tryRepairJson(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Remove any markdown code fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If it's already valid JSON, return as-is
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Continue with repair attempts
  }
  
  // Try to extract JSON object from the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Common fixes for malformed JSON
  let repaired = cleaned
    // Fix missing quotes around keys
    .replace(/(\w+):/g, '"$1":')
    // Fix single quotes to double quotes
    .replace(/'/g, '"')
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties
    .replace(/"\s*\n\s*"/g, '",\n"')
    // Fix unescaped quotes in strings
    .replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\\"$2\\"$3":')
    // Ensure proper array formatting
    .replace(/\[\s*\]/g, '[]')
    // Fix boolean values
    .replace(/:\s*(true|false)\s*([,}])/g, ': $1$2')
    // Fix null values
    .replace(/:\s*null\s*([,}])/g, ': null$1');
  
  // Try to parse the repaired JSON
  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    // If repair failed, return original text
    return text;
  }
}

export function parseJsonSafe(text: string): any {
  if (!text || typeof text !== 'string') return null;
  
  try {
    return JSON.parse(text);
  } catch {
    // Try repair first
    const repaired = tryRepairJson(text);
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}
