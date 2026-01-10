# Debug Settings Issue

## Problem
App says "Add an API key in Settings" even though user claims to have added one.

## Root Cause
The API key is either:
1. Not being saved to localStorage
2. Being saved with empty string value
3. Structure mismatch between what's saved and what's being read

## How to Debug

### 1. Open Browser Console
- Press F12 in browser
- Go to Console tab

### 2. Check localStorage
```javascript
// Copy and paste this in console:
console.log(JSON.stringify(JSON.parse(localStorage.getItem('core_dna_settings')), null, 2));
```

### 3. What to look for
Should see structure like:
```json
{
  "llms": {
    "google": {
      "provider": "google",
      "enabled": true,
      "apiKey": "YOUR_API_KEY_HERE"
    }
  },
  "activeLLM": "google"
}
```

### 4. Common Issues

**Issue A: API key is empty string**
```json
"apiKey": ""
```
- Solution: Go back to Settings, add the API key again, click Save

**Issue B: No `llms` object**
```json
{
  "image": {...},
  "voice": {...}
}
```
- Solution: Settings structure is wrong, may need to clear localStorage and reset

**Issue C: activeLLM not set**
- Solution: Select "Primary LLM" dropdown in Settings and choose a provider

## Fix Steps

### Step 1: Clear Settings
```javascript
// In browser console:
localStorage.removeItem('core_dna_settings');
location.reload();
```

### Step 2: Re-add API Key
1. Go to Settings page
2. Click LLM tab
3. Select "Primary LLM Engine" dropdown
4. Choose "Google Gemini" (or another provider)
5. Paste your API key in the field
6. Look for green checkmark or save button
7. Click "Save Settings"

### Step 3: Verify Saved
```javascript
// Check console again:
const s = JSON.parse(localStorage.getItem('core_dna_settings'));
console.log('API Key for Google:', s.llms.google?.apiKey);
console.log('Active LLM:', s.activeLLM);
```

### Step 4: Try Extraction
1. Go to Extract page
2. Enter URL
3. Click "Extract Brand DNA"

## What the Code Does

**In geminiService.ts** (line 558-584):
```typescript
const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  // Check 1: Is activeLLM set and has API key?
  if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
    return settings.activeLLM;
  }
  
  // Check 2: Find first LLM with API key
  if (settings.llms) {
    for (const [key, config] of Object.entries(settings.llms)) {
      if (config.apiKey && config.apiKey.trim()) {
        return key;
      }
    }
  }
  
  // If neither works, throw error
  throw new Error('No LLM provider configured...');
};
```

The key requirement: **apiKey must be non-empty string**

## Browser DevTools Tips

### See all console logs:
1. Filter by `[getActiveLLMProvider]` or `[GeminiService]`
2. Shows exactly which check is failing

### Monitor localStorage changes:
1. Open DevTools → Application tab
2. Click localStorage
3. Select your domain
4. Watch for `core_dna_settings` key
5. Should update when you save Settings

### Check network requests:
1. Open DevTools → Network tab
2. Try extraction
3. Should see Gemini API call (or your provider)
4. Check response for errors

## If Settings Keep Resetting

The Settings page has auto-save (2 second debounce):
```typescript
const autoSaveTimer = setTimeout(async () => {
  await saveSettings(settings);
}, 2000);
```

If you're still on Settings page when auto-save fires, it should save automatically.

**Make sure to:**
- Wait for "Settings saved" message
- Don't navigate away immediately after entering key
- Allow 2+ seconds before leaving Settings page

## Provider Names Matter

Make sure provider name matches:

| In LLM Section | Provider Name | Correct |
|---|---|---|
| google | `google` | ✓ |
| openai | `openai` | ✓ |
| anthropic | `anthropic` | ✓ |
| mistral | `mistral` | ✓ |

Name must exactly match the key in `settings.llms`

## Next Steps

1. Open browser console (F12)
2. Run the localStorage check
3. Report what you see
4. If empty, repeat "Fix Steps" above
5. If structure wrong, clear cache and refresh
