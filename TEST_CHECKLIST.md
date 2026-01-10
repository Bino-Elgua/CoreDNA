# CoreDNA2 Provider Selection Test Checklist

## Build Status
✅ **Build Passes** - `npm run build` completes successfully with no errors
✅ **No Syntax Errors** - All modified files have correct TypeScript syntax
✅ **All Exports Valid** - Provider wrapper functions export correctly

## Provider Selection Tests

### Test 1: LLM Provider Selection
**Steps:**
1. Go to Settings → LLM Providers
2. Select "Mistral AI" from "Primary LLM" dropdown
3. Add your Mistral API key
4. Click "Save Settings"

**Expected Result:**
- ✅ Settings saved
- ✅ "Mistral AI" shows as selected
- ✅ API key is stored in localStorage

---

### Test 2: Extract Brand DNA with Selected Provider
**Steps:**
1. Navigate to Extract page
2. Enter URL: `https://example.com`
3. Click "Extract DNA"

**Expected Result:**
- ✅ Request goes to Mistral API (not Gemini)
- ✅ No "Gemini quota exceeded" error
- ✅ Brand DNA extracted successfully
- ✅ Results display DNA analysis

**Verify in DevTools Console:**
- Should see: `[getActiveLLMProvider] ✓ Using explicitly set activeLLM from Settings: mistral`
- Should see: Mistral API endpoint requests, NOT Gemini

---

### Test 3: Generate Campaign Assets
**Steps:**
1. After extracting brand DNA, click "Generate Assets"
2. Set goal to "brand awareness"
3. Click "Generate"

**Expected Result:**
- ✅ Uses Mistral provider (configured in settings)
- ✅ Generates campaign assets
- ✅ No Gemini quota errors

**Console Check:**
- `[getActiveLLMProvider]` logs show Mistral is selected

---

### Test 4: Run Battle Mode
**Steps:**
1. Go to Battle Mode page
2. Enter two brand URLs
3. Click "Start Battle"

**Expected Result:**
- ✅ Battle uses Mistral provider
- ✅ Simulation completes without provider errors

---

### Test 5: Asset Image Generation
**Steps:**
1. Go to Extract page → Generate Assets
2. Look for any image generation

**Expected Result:**
- ✅ If no image provider configured: Error message "No image generation provider configured"
- ✅ If image provider configured: Uses selected image provider

---

### Test 6: Error Handling - No Provider Configured
**Steps:**
1. Clear settings (Settings → Clear All Settings)
2. Try to Extract Brand DNA

**Expected Result:**
- ✅ Error message: "No LLM provider configured. Please select an LLM provider in Settings and add its API key."
- ✅ User is directed to Settings
- ✅ NOT a silent Gemini fallback

---

### Test 7: API Key Retrieval Buttons
**Steps:**
1. Go to Settings → API Keys
2. Scroll through provider list
3. Click "🔑 Get API Key" button on Mistral provider

**Expected Result:**
- ✅ Button is prominently styled (blue background)
- ✅ Button has full width in card
- ✅ Opens Mistral's official API key page in new tab
- ✅ Works for all providers

**Providers to Test:**
- [ ] Mistral
- [ ] OpenAI
- [ ] Claude (Anthropic)
- [ ] Groq
- [ ] DeepSeek

---

### Test 8: Voice Provider Selection (if enabled)
**Steps:**
1. Settings → Voice Providers
2. Select "ElevenLabs" from "Primary Voice Engine"
3. Add ElevenLabs API key
4. Try to generate website with voice enabled

**Expected Result:**
- ✅ Uses ElevenLabs TTS (not hardcoded default)
- ✅ No provider confusion errors

---

### Test 9: Sonic CoPilot Intent Detection
**Steps:**
1. Go to Sonic Lab
2. Type: "Extract apple.com"

**Expected Result:**
- ✅ Intent detection uses configured LLM (Mistral)
- ✅ No Gemini quota errors
- ✅ Correctly parses intent

**Console Check:**
- Should show Mistral provider being used, not Gemini

---

### Test 10: Sonic CoPilot Extract Command
**Steps:**
1. In Sonic Lab, type: "Extract https://github.com"
2. Wait for extraction

**Expected Result:**
- ✅ Uses Mistral provider for DNA extraction
- ✅ No hardcoded Gemini calls
- ✅ Extraction completes

---

### Test 11: Multiple Provider Testing
**Steps:**
1. Settings → LLM Providers
2. Switch to "OpenAI" as Primary LLM
3. Add OpenAI API key
4. Save settings
5. Extract Brand DNA again

**Expected Result:**
- ✅ Request now uses OpenAI (not Mistral, not Gemini)
- ✅ Console shows: `[getActiveLLMProvider] ✓ Using explicitly set activeLLM from Settings: openai`
- ✅ Can switch providers and app respects selection

---

## Code Verification Tests

### Test 12: No Hardcoded Gemini Defaults
**Run in terminal:**
```bash
grep -r "geminiService.generate('gemini'" CoreDNA2-work --include="*.tsx" --include="*.ts"
```

**Expected Result:**
- ✅ No output (all hardcoded Gemini calls removed)

---

### Test 13: Provider Functions Pass Provider Parameter
**Check these functions pass provider to generate():**

```typescript
// All should show provider parameter
- universalGenerate()
- generateAgentSystemPrompt()
- runBattleSimulation()
- analyzeUploadedAssets()
- optimizeSchedule()
- generateTrendPulse()
- refineAssetWithAI()
```

**Verification:**
```bash
grep -A 2 "export const universalGenerate\|export const generateAgentSystemPrompt" services/geminiService.ts
```

**Expected Result:**
- ✅ All functions call `getActiveLLMProvider()`
- ✅ All pass provider to `geminiService.generate()`

---

### Test 14: Error Fallbacks Are Correct
**Verify these throw errors instead of using defaults:**

```typescript
// Should throw errors:
- getActiveLLMProvider() if no provider
- generateAssetImage() if no image provider
- extractSonicConfig() if voice enabled but no TTS provider
```

**Expected in code:**
- ✅ `throw new Error(...)` statements exist
- ✅ No silent `|| 'providerName'` fallbacks

---

## Performance Tests

### Test 15: Build Size
```bash
npm run build
```

**Expected:**
- ✅ Completes in < 15 seconds
- ✅ No critical errors in output
- ✅ geminiService bundle size reasonable

---

## Browser DevTools Tests

### Test 16: LocalStorage Provider Config
**In DevTools Console:**
```javascript
JSON.parse(localStorage.getItem('core_dna_settings'))
// Should show: { activeLLM: 'mistral', ... }
```

**Expected:**
- ✅ `activeLLM` matches selected provider
- ✅ Correct API key stored for provider

---

### Test 17: Network Requests
**Open DevTools → Network tab**
1. Extract Brand DNA
2. Filter requests to API endpoints

**Expected:**
- ✅ Requests go to Mistral API (api.mistral.ai)
- ✅ NOT to generativelanguage.googleapis.com (Gemini)
- ✅ Authorization headers include Mistral key

---

### Test 18: Console Logs
**Check DevTools Console:**
```
[getActiveLLMProvider] ✓ Using explicitly set activeLLM from Settings: mistral
```

**Expected:**
- ✅ Shows correct provider selection
- ✅ No errors about missing providers
- ✅ Clear logging for debugging

---

## Regression Tests

### Test 19: Gemini Still Works
**Steps:**
1. Settings → Select "Google Gemini" as Primary LLM
2. Add Gemini API key (free tier available)
3. Extract Brand DNA

**Expected:**
- ✅ Gemini provider works when explicitly selected
- ✅ No hardcoded defaults interfering

---

### Test 20: Multi-Provider Workflow
**Steps:**
1. LLM: Mistral
2. Image Gen: OpenAI (DALL-E)
3. Voice: ElevenLabs
4. Generate website with all features

**Expected:**
- ✅ Each feature uses correct provider
- ✅ No provider cross-contamination
- ✅ No quota exceeded errors for any provider

---

## Summary

- **Total Tests:** 20
- **Critical Tests (1-6, 12-14):** Must pass
- **Feature Tests (7-11, 15-20):** Should pass

**Pass Criteria:**
- ✅ All critical tests pass
- ✅ No hardcoded defaults remain
- ✅ User-selected provider is always respected
- ✅ No Gemini quota errors when using other providers
