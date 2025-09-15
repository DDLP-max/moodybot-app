# Validation API Testing Guide

## Ship-Gate Checklist ✅

### 1. Network Tab Verification
- [ ] Open DevTools → Network → `/api/validation`
- [ ] Verify `X-MB-Route: validation` header on every response
- [ ] Check Request Payload includes all fields as strings:
  - `relationship`: "friend" | "mentor" | "partner" | etc.
  - `mode`: "positive" | "negative" | "mixed"
  - `style`: "MoodyBot" | "Gentle" | "Direct" | etc.
  - `intensity`: "feather" | "casual" | "firm" | "heavy"
  - `length`: "1-line" | "2-3-lines" | "short-paragraph"
  - `include_followup`: true | false
  - `tags`: ["faith", "family", "leadership"]

### 2. Server Logs Verification
- [ ] Check server logs show `VAL/PAYLOAD` with all fields
- [ ] Verify `VAL/SYSTEM_PROMPT` includes injected values:
  - `relationship = friend`
  - `mode = positive`
  - `style = MoodyBot`
  - `intensity = casual`
  - `length = 2-3-lines`
  - `tags = [faith, family, leadership]`

### 3. Length Compliance
- [ ] **1-line**: Exactly one sentence, no line breaks
- [ ] **2-3-lines**: ≤ 3 lines (≤ 2 newlines)
- [ ] **short-paragraph**: Single paragraph, 3-5 sentences

### 4. Relationship Tone Changes
- [ ] **Friend**: Casual, supportive language
- [ ] **Mentor**: Formal, guidance-oriented
- [ ] **Partner**: Intimate, personal validation

### 5. Mode Changes
- [ ] **Positive → Mixed**: Different word choice, no identical phrasing
- [ ] **Positive + Feather**: Gentle, non-combative language
- [ ] **Mixed + Firm**: Supportive with challenge

### 6. BAN List Enforcement
- [ ] No banned phrases appear in responses:
  - "That wasn't luck"
  - "You were swinging"
  - "Most people drift"
  - "That's why it hit"
  - "You didn't get lucky"
  - "That wasn't noise"
  - "Repeatable, earned"
  - "You got serious and it shows"

## Smoke Tests

### Test A: Positive • Friend • Casual • 2–3-lines
```bash
curl -X POST http://localhost:3001/api/validation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "She led teams for years, credits faith and family, wants to open a studio with her sister.",
    "relationship": "friend",
    "mode": "positive",
    "style": "MoodyBot",
    "intensity": "casual",
    "length": "2-3-lines",
    "include_followup": true,
    "followup_style": "question",
    "tags": ["faith", "family", "leadership"],
    "system_flavor": "validation",
    "version": "v1"
  }'
```

**Expected**: Warm, supportive, specific; 2–3 lines; 1 follow-up question

### Test B: Positive • Mentor • Feather • 1-line
```bash
curl -X POST http://localhost:3001/api/validation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "She led teams for years, credits faith and family, wants to open a studio with her sister.",
    "relationship": "mentor",
    "mode": "positive",
    "style": "Gentle",
    "intensity": "feather",
    "length": "1-line",
    "include_followup": true,
    "followup_style": "reflection",
    "tags": ["discipline", "service"],
    "system_flavor": "validation",
    "version": "v1"
  }'
```

**Expected**: Single gentle sentence; ends without newline; 1 reflection follow-up

### Test C: Mixed • Partner • Firm • short-paragraph
```bash
curl -X POST http://localhost:3001/api/validation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "She led teams for years, credits faith and family, wants to open a studio with her sister.",
    "relationship": "partner",
    "mode": "mixed",
    "style": "Direct",
    "intensity": "firm",
    "length": "short-paragraph",
    "include_followup": true,
    "followup_style": "prompt",
    "tags": ["accountability", "vision"],
    "system_flavor": "validation",
    "version": "v1"
  }'
```

**Expected**: Supportive + one crisp challenge; 3–5 sentences; 1 prompt follow-up

## Automated Testing

### Run Smoke Tests
```bash
node smoke-test-validation.js
```

### Run Unit Tests
```bash
node test-scorer.js
```

### Run Playwright Tests
```bash
npx playwright test playwright-validation.spec.ts
```

## Golden Baseline Outputs

### Friend • Positive • Casual • 2–3-lines
```
Your joy is disciplined, not accidental—years of reps, leadership, and faith made this dream real.
Family and sisterhood keep you grounded while you aim higher.
Follow-up: What's the first class you'll put on the studio schedule?
```

### Mentor • Positive • Feather • 1-line
```
Your consistency, anchored by faith and family, is the engine that keeps turning dreams into milestones. Follow-up: Where will you invest the next 1%?
```

### Partner • Mixed • Firm • short-paragraph
```
I love how your faith and family orient you—and I also want you ruthless about the next step: timeline, budget, first five students. The résumé proves you can lead; the studio proves you can ship. Keep the joy, keep the sisterhood, but put dates on the calendar so momentum can't slip.
Follow-up: What's the launch date you're willing to defend?
```

## Common Issues & Solutions

### Wrong Route
- **Symptom**: Network tab lacks `X-MB-Route: validation`
- **Solution**: Check route configuration, ensure no middleware interference

### Enum Drift
- **Symptom**: UI sends numbers but server expects strings
- **Solution**: Fix client-side mapping in `validation.tsx`

### Prompt Not Injected
- **Symptom**: Logs don't show control values in `VAL/SYSTEM_PROMPT`
- **Solution**: Check system prompt template string interpolation

### Caching Issues
- **Symptom**: Same responses despite different inputs
- **Solution**: Hard reload (Cmd/Ctrl+Shift+R) or add cache-buster

### Model Parameters
- **Symptom**: Bland, same-ish responses
- **Solution**: Increase temperature to 0.7-0.85 for Positive/Casual modes

## Debug Toggles

Set environment variables to control debugging:
```bash
DEBUG_VALIDATION=true npm run dev
```

This enables:
- Client-side payload logging
- Server-side prompt logging
- Length assertion warnings
- BAN tripwire logging
