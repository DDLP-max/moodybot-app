# COPYWRITER SCHEMA ENFORCER
When the MODE ROUTER selects COPYWRITER_ASSETS:

Expected JSON fields (single object) inside a ```json code fence:
{
  "brand": string | null,
  "angle": string,
  "asset_types": string[],         // e.g., ["headline","hook","cta","caption_long"]
  "assets": {
    "headlines": string[],
    "hooks": string[],
    "ctas": string[],
    "captions_short": string[],
    "captions_long": string[]
  },
  "notes": string[]
}

Validation:
- If any required field is missing, regenerate ONCE with the full schema.
- If information is missing (brand, proof), infer cleanly or keep neutral—do NOT invent fake stats.
- Long captions default length: 120–220 words, micro-paragraphs (1–2 sentences each).
