# Curl Test Commands for Validation API

## Test 1: Known Good Payload
```bash
curl -i http://localhost:3001/api/validation \
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

## Test 2: Minimal Payload
```bash
curl -i http://localhost:3001/api/validation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "relationship": "friend",
    "mode": "positive",
    "style": "MoodyBot",
    "intensity": "casual",
    "length": "1-line",
    "include_followup": false,
    "tags": [],
    "system_flavor": "validation",
    "version": "v1"
  }'
```

## Test 3: Wrong Field (Should get 422)
```bash
curl -i http://localhost:3001/api/validation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "relationship": "friend",
    "mode": "positive",
    "style": "MoodyBot",
    "intensity": "casual",
    "length": "2-3-lines",
    "includeFollowUp": false,
    "tags": [],
    "system_flavor": "validation",
    "version": "v1"
  }'
```

## Test 4: Wrong Enum Value (Should get 422)
```bash
curl -i http://localhost:3001/api/validation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "relationship": "friend",
    "mode": "positive",
    "style": "MoodyBot",
    "intensity": "Casual",
    "length": "2-3-lines",
    "include_followup": false,
    "tags": [],
    "system_flavor": "validation",
    "version": "v1"
  }'
```

## Expected Results:
- **Test 1 & 2**: Should return 200 with `{"ok": true, "data": {...}}`
- **Test 3**: Should return 422 with `zod_errors` showing `includeFollowUp` is not allowed
- **Test 4**: Should return 422 with `zod_errors` showing `intensity: "Casual"` is invalid (should be `"casual"`)
