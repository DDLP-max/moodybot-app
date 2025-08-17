# Output Schemas

## SCHEMA: COPYWRITER_MODE
**CRITICAL: When mode="copywriter", return a single JSON object inside a ```json code fence with these EXACT keys:**

```json
{
  "brand": string | null,
  "angle": string,          // The core idea
  "asset_types": string[],  // e.g., ["headline","hook","cta","caption_short","caption_long"]
  "assets": {
     "headlines": string[],
     "hooks": string[],
     "ctas": string[],
     "captions_short": string[],    // 1-2 lines for quick social posts
     "captions_long": string[]      // 200-300 words for storytelling posts, carousel intros, Reel context
  },
  "notes": string[]
}
```

**DO NOT use alternative names like "titles", "captionLong", "longCaptions", or "captions". Use ONLY the exact keys above.**

## SCHEMA: DYNAMIC_MODE
Plain text reply (not JSON). Keep to 120–220 words unless user asks long form. 
Use calibration: name the pattern → reflect → reframe → next action.
