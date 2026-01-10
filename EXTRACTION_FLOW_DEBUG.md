# CoreDNA2 Extraction Flow - Debug Guide

## Complete Flow Diagram

```
User Input (URL + Brand Name)
    ↓
ExtractPage.tsx → handleExtractDNA()
    ↓
[Check RLM Active]
    ├─ YES → rlmService.extractFullDNA()
    └─ NO → analyzeBrandDNA() ← MAIN FLOW
    ↓
geminiService.ts → analyzeBrandDNA(url, brandName)
    ↓
[1] getActiveLLMProvider()
    → Reads localStorage['core_dna_settings']
    → Finds first LLM provider with apiKey
    → Returns provider name (e.g., 'openai', 'gemini', 'claude')
    ↓ ERROR HERE?
    Check: console for "[getActiveLLMProvider]" logs
    
[2] geminiService.generate(provider, prompt)
    → Calls appropriate provider API (OpenAI, Claude, Gemini, etc.)
    → Sends structured prompt asking for JSON
    → Returns response string
    ↓ ERROR HERE?
    Check: Network tab in DevTools
    Check: Console for API errors
    
[3] JSON Parsing
    → Tries to extract JSON with regex: /\{[\s\S]*\}/
    → Falls back if markdown wrapped (```json...```)
    → Parses JSON.parse(jsonStr)
    ↓ ERROR HERE?
    Check: console for "[analyzeBrandDNA]" logs
    
[4] Field Mapping
    → Maps LLM response to BrandDNA structure
    → Applies defaults for missing fields
    → Validates arrays (colors, fonts, personas, etc.)
    ↓
Return BrandDNA object
    ↓
ExtractPage.tsx → setDnaResult(dna)
    → Saves to localStorage['core_dna_profiles']
    ↓
DNAProfileCard.tsx → Display with tabs
    → Intelligence, Performance, Strategy, Visual, Market, Voice
```

## Key Logging Points

### 1. API Key Detection
```
[getActiveLLMProvider] Detecting active LLM provider...
[getActiveLLMProvider] ✓ Using first available LLM: openai
                      OR
[getActiveLLMProvider] ✗ No LLM provider configured with API key
```

### 2. API Response
```
[analyzeBrandDNA] Raw response: {"name": "...", ...}
[analyzeBrandDNA] Parsed successfully: Brand Name
```

### 3. Error Handling
```
[analyzeBrandDNA] Parse error: SyntaxError: Unexpected token
[analyzeBrandDNA] This means the LLM response was not valid JSON
```

## Testing Checklist

### ✅ Step 1: Verify API Key is Set
- Open browser DevTools (F12)
- Go to Console
- Paste: `JSON.parse(localStorage.getItem('core_dna_settings')).llms`
- Should show at least one provider with apiKey field

### ✅ Step 2: Try Extraction
- Enter URL: `https://www.apple.com`
- Brand Name: `Apple`
- Click "Extract DNA"
- Watch Console for:
  ```
  [getActiveLLMProvider] ✓ Using first available LLM: openai
  [analyzeBrandDNA] Raw response: {...}
  [analyzeBrandDNA] Parsed successfully: Apple
  ```

### ✅ Step 3: Check Result
- If blank profile → Check Step 2 logs for parse error
- If error message → Check network tab for API error
- If loading forever → Network request stuck (timeout/CORS)

## Common Issues & Fixes

### Issue 1: "Analysis in progress - please refresh"
**Cause:** JSON parse failed
**Fix:** Check console for parse error message
**Action:** Look at raw LLM response, ensure it's valid JSON

### Issue 2: Blank Profile (No Fields Filled)
**Cause:** Either:
  - JSON parse succeeded but returned empty object
  - API key not found/invalid
  - Network timeout
**Fix:** 
  - Check `[getActiveLLMProvider]` logs
  - Check Network tab for failed requests
  - Verify API key in Settings

### Issue 3: "No LLM provider configured"
**Cause:** No API key in localStorage
**Fix:**
  - Go to Settings → API Keys
  - Add at least one LLM provider (OpenAI, Claude, etc.)
  - Ensure API key is valid

### Issue 4: CORS Error
**Cause:** Browser blocking cross-origin request
**Fix:** This is provider-specific
  - OpenAI: Requires valid API key header
  - Some providers: Require server-side proxy
  - Check provider documentation

## LocalStorage Structure

```javascript
core_dna_settings = {
  llms: {
    openai: {
      apiKey: "sk-...",
      defaultModel: "gpt-4o"
    },
    claude: {
      apiKey: "sk-ant-...",
      defaultModel: "claude-3-5-sonnet-20241022"
    }
  },
  activeLLM: "openai"
}

core_dna_profiles = [
  {
    id: "dna_1234567890",
    name: "Brand Name",
    tagline: "...",
    description: "...",
    // ... all other BrandDNA fields
  }
]
```

## Network Request Example

**Endpoint:** Depends on provider
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Claude: `https://api.anthropic.com/v1/messages`
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/...`

**Request Body:** Structured prompt asking for JSON with specific fields

**Expected Response:** Valid JSON matching BrandDNA structure

## Next Steps if Still Broken

1. Clear localStorage and Settings
2. Re-add API key
3. Try with simplest provider (OpenAI GPT-4o)
4. Check DevTools Console for all [analyzeBrandDNA] logs
5. Check Network tab for API response
6. Verify prompt is being sent correctly
