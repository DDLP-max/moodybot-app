import { ValidationMode } from '@/lib/types/validation';

export function resolveMode(
  mode: ValidationMode,
  message: string
): Exclude<ValidationMode, 'auto'> {
  if (mode !== 'auto') return mode;

  // --- Simple heuristic (replace with server LLM if you want) ---
  const s = message.toLowerCase();

  const negHints = ['stupid', 'hate', 'failed', 'embarrass', 'anxious', 'panic', 'idiot', 'ashamed', 'regret', 'mad', 'angry'];
  const posHints = ['excited', 'grateful', 'proud', 'happy', 'relieved'];

  const negScore = negHints.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);
  const posScore = posHints.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);

  if (negScore > posScore + 1) return 'negative';
  if (posScore > negScore + 1) return 'positive';
  return 'mixed';
}
