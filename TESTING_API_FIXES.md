# CoreDNA2 API Fixes - Testing Guide

## Quick Start Test (5 minutes)

### 1. Clear & Start Fresh
```bash
# In browser console, clear old data:
localStorage.clear()

# Start dev server:
npm install
npm run dev
```

### 2. First Load - Should See API Prompt
- Navigate to `http://localhost:3000`
- You should see **ApiKeyPrompt modal**
- Click "Get Free Gemini API Key"
- Or click "Add Later" to skip

### 3. Add API Key
- Click Settings (bottom navigation)
- Click "API Keys" tab
- Find "Google Gemini" under LLM Providers
- Get free key from: https://aistudio.google.com/apikey
- Paste key into CoreDNA2
- Click Save

### 4. Verify Storage
Open browser DevTools Console and run:
```javascript
// Check settings were saved correctly
JSON.parse(localStorage.getItem('core_dna_settings')).llms.google.apiKey
// Should output: "your-gemini-api-key-here"

// Check that old flat structure is NOT used
localStorage.getItem('apiKeys')
// Should output: null (not used anymore)
```

### 5. Test Brand Extraction
- Go to **Extract** page
- Enter a website (e.g., `https://apple.com`)
- Click "Extract Brand DNA"
- In console, should see: `[GeminiService] ✓ Found LLM API key for google`
- Wait for analysis to complete
- Should get brand DNA results

### 6. Test Campaign Generation
- Select the extracted DNA from Dashboard
- Go to **Campaigns** page
- Enter a goal (e.g., "Increase brand awareness")
- Click "Generate Campaign"
- Should create assets without API key errors

---

## Full Testing Checklist

### A. Storage & Keys
- [ ] `localStorage['core_dna_settings']` exists
- [ ] Has structure: `llms.{provider}.apiKey`
- [ ] No `localStorage['apiKeys']` (old flat structure)
- [ ] No API keys in browser Network tab (check request bodies)
- [ ] No API keys in vite.config.ts output
- [ ] No API keys exposed in page source

### B. API Key Management
- [ ] Can add Gemini key in Settings
- [ ] Can add OpenAI key in Settings
- [ ] Can add Claude key in Settings
- [ ] Can remove keys by clearing Settings field
- [ ] Can edit existing keys
- [ ] Show/hide toggle works
- [ ] Keys persist after page refresh

### C. Provider Selection
- [ ] First load with no key → Shows ApiKeyPrompt
- [ ] After adding key → Prompt doesn't show again
- [ ] Console shows: `[GeminiService] ✓ Found LLM API key for {provider}`
- [ ] Can switch between multiple configured providers
- [ ] Explicitly selecting provider in Settings respects selection

### D. Extract Page
- [ ] Loading message shows
- [ ] Uses correct API provider
- [ ] Gets brand DNA from website
- [ ] Stores result in localStorage
- [ ] Can extract multiple profiles
- [ ] Shows error if no API key configured

### E. Campaign Page
- [ ] Can generate campaign assets
- [ ] Uses active LLM provider
- [ ] Can generate images (if image provider configured)
- [ ] Shows proper error messages
- [ ] Can save campaigns

### F. Error Handling
- [ ] Invalid API key → Clear error message
- [ ] Missing API key → Directs to Settings
- [ ] Network error → Shows friendly message
- [ ] Wrong provider selected → Shows which providers available

### G. Console Logs (Should See)
```
[GeminiService] Getting API key for provider: google
[GeminiService] ✓ Found LLM API key for google
[getActiveLLMProvider] Detecting active LLM provider...
[getActiveLLMProvider] ✓ Using configured activeLLM: google
```

### H. Console Logs (Should NOT See)
```
[GeminiService] process.env.GEMINI_API_KEY
[GeminiService] process.env.API_KEY
process.env.API_KEY is undefined
JSON.stringify(apiKeys) with real keys
```

---

## Testing Different Providers

### Gemini (Free)
```javascript
// Get free key from: https://aistudio.google.com/apikey
// Add in Settings → API Keys → Google Gemini
// Click "Save & Start Extracting"
```

### OpenAI
```javascript
// Get key from: https://platform.openai.com/api-keys
// Add in Settings → API Keys → OpenAI
// Requires credit card (paid)
```

### Claude
```javascript
// Get key from: https://console.anthropic.com/settings/keys
// Add in Settings → API Keys → Anthropic Claude 3.5
// Requires credit card (paid)
```

### Ollama (Local)
```bash
# Install Ollama: https://ollama.ai
# Run: ollama serve
# In CoreDNA2 Settings → API Keys → Ollama (Local)
# Endpoint: http://localhost:11434
# No API key needed (local)
```

---

## Verification Script

Run this in browser console to verify fixes:

```javascript
// 1. Check no exposed API keys
console.log('=== CHECKING VITE CONFIG ===');
console.assert(!process.env.GEMINI_API_KEY, '✓ No VITE_GEMINI_API_KEY exposed');
console.assert(!process.env.API_KEY, '✓ No VITE_API_KEY exposed');

// 2. Check settings structure
console.log('\n=== CHECKING SETTINGS STRUCTURE ===');
const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.assert(settings.llms, '✓ Has llms object');
console.assert(typeof settings.llms === 'object', '✓ LLMs is object (not flat)');

// 3. Check no old format
console.log('\n=== CHECKING NO OLD FORMAT ===');
console.assert(!localStorage.getItem('apiKeys'), '✓ Old apiKeys format not used');

// 4. List configured providers
console.log('\n=== CONFIGURED PROVIDERS ===');
const configured = [];
if (settings.llms) {
  Object.entries(settings.llms).forEach(([k, v]: [string, any]) => {
    if (v.apiKey) configured.push(`LLM: ${k}`);
  });
}
if (settings.image) {
  Object.entries(settings.image).forEach(([k, v]: [string, any]) => {
    if (v.apiKey) configured.push(`Image: ${k}`);
  });
}
console.log('Providers with keys:', configured.length ? configured : 'None');

// 5. Test active provider
console.log('\n=== TESTING ACTIVE PROVIDER ===');
console.assert(settings.activeLLM, '✓ Has activeLLM set');
const activeConfig = settings.llms?.[settings.activeLLM];
console.assert(activeConfig?.apiKey, `✓ Active provider has API key: ${settings.activeLLM}`);

console.log('\n✅ All checks passed!');
```

---

## Common Issues & Solutions

### Issue: "API key not configured"
**Solution:**
1. Go to Settings → API Keys
2. Find your provider (Google Gemini recommended for free tier)
3. Paste API key (from https://aistudio.google.com/apikey)
4. Click Save
5. Refresh page

### Issue: "Cannot read property 'apiKey' of undefined"
**Solution:**
1. Check that settings.llms[provider] exists
2. Try Settings → Export/Import to reset structure
3. Clear localStorage and start fresh

### Issue: API key not being used
**Solution:**
1. Open DevTools Console
2. Trigger an action (Extract DNA)
3. Look for: `[GeminiService] ✓ Found LLM API key for {provider}`
4. If not found, key isn't saved in settings

### Issue: See "process.env is undefined"
**Solution:**
1. This is OK - it means vite config is correct
2. Verify no errors about missing keys
3. Keys should come from localStorage, not process.env

---

## Browser DevTools Debugging

### Check API Calls
1. Open DevTools → Network tab
2. Extract a brand DNA
3. Look for requests to:
   - `generativelanguage.googleapis.com` (Gemini)
   - `api.openai.com` (OpenAI)
   - `api.anthropic.com` (Claude)
4. Verify API key is in **headers**, not body
5. Verify Gemini: `x-goog-api-key: YOUR-KEY`

### Check localStorage
1. Open DevTools → Application → Local Storage
2. Find `http://localhost:3000`
3. Expand to see:
   - `core_dna_settings` (main settings with API keys)
   - `core_dna_profiles` (extracted DNAs)
   - `apiPromptDismissed` (prompt state)
4. Verify structure is JSON

### Monitor Console
1. Open DevTools → Console
2. Look for GeminiService logs:
   ```
   [GeminiService] Getting API key for provider: google
   [GeminiService] ✓ Found LLM API key for google
   ```
3. Should NOT see:
   ```
   [GeminiService] No API key found for google
   process.env.GEMINI_API_KEY is undefined
   ```

---

## Performance Testing

Add this to Console to test speed:

```javascript
const startTime = performance.now();
// Do an extraction
const endTime = performance.now();
console.log(`Extraction took: ${(endTime - startTime) / 1000}s`);
```

Expected times:
- Gemini: 5-15 seconds
- OpenAI: 5-20 seconds
- Claude: 5-15 seconds
- Ollama (local): 10-60 seconds (depends on model)

---

## Report Issues

If tests fail, check:
1. Browser console for errors
2. Network tab for API errors
3. localStorage for settings structure
4. That API key is valid and has quota

If issues persist, provide:
1. Browser console output
2. localStorage contents (without actual keys)
3. Network request headers
4. Which provider + operation failed
