# CoreDNA2 API Fixes - Quick Reference

## What Was Wrong

API keys were being **exposed to the frontend** instead of managed securely by users:
- Hardcoded in `vite.config.ts`
- Defaulted in `SettingsPage.tsx`
- Code checked 3 different storage locations
- Conflicting provider selection logic

## What's Fixed

✅ No API keys exposed in build
✅ No hardcoded defaults
✅ Single storage location: `localStorage['core_dna_settings']`
✅ Clear provider selection logic
✅ Proper BYOK (Bring Your Own Keys) model

## 4 Files Changed

### 1. vite.config.ts
```diff
- define: { 'process.env.API_KEY': ... }
+ define: { } // No API keys exposed
```

### 2. SettingsPage.tsx  
```diff
- google: { ..., apiKey: process.env.API_KEY || '' },
+ google: { ..., apiKey: '' },
```

### 3. geminiService.ts
```diff
- Check old apiKeys storage
+ Check only core_dna_settings
```

### 4. App.tsx
```diff
- Check both old and new storage
+ Check only core_dna_settings  
```

## How to Use

1. **Start app**
   ```bash
   npm install && npm run dev
   ```

2. **Add API key**
   - Click Settings
   - Click "API Keys" tab
   - Find provider (Gemini = free)
   - Paste key from provider website
   - Click Save

3. **Use app**
   - Extract brand DNA
   - Generate campaigns
   - Use any LLM provider

## Storage Structure

```javascript
// localStorage['core_dna_settings']
{
  llms: {
    google: { apiKey: 'your-key-here', ... },
    openai: { apiKey: '', ... },
    anthropic: { apiKey: '', ... }
  },
  image: { ... },
  voice: { ... },
  activeLLM: 'google'
}

// localStorage['apiKeys'] - NOT USED ANYMORE
```

## Console Messages

### Good (Expected):
```
[GeminiService] ✓ Found LLM API key for google
[getActiveLLMProvider] ✓ Using configured activeLLM: google
```

### Bad (Not expected):
```
[GeminiService] ✗ No API key found for google
process.env.GEMINI_API_KEY is undefined
localStorage['apiKeys'] is not used
```

## Testing

```javascript
// Browser console:
JSON.parse(localStorage.getItem('core_dna_settings')).llms.google.apiKey
// Should output your API key

localStorage.getItem('apiKeys')  
// Should output: null (not used)
```

## Files to Read

1. **FIXES_SUMMARY.md** - High-level overview
2. **API_FIXES_APPLIED.md** - Detailed explanations  
3. **CHANGES_DETAILED.md** - Exact code changes with line numbers
4. **TESTING_API_FIXES.md** - Step-by-step testing guide

## Deployment

✅ Safe for production
✅ No API keys in environment variables
✅ No API keys in source code
✅ User-provided keys via Settings

## Key Points

1. **Users add keys** through Settings → API Keys
2. **Keys stored** in localStorage only (browser)
3. **CoreDNA never sees** the API keys
4. **Direct calls** from browser to provider API
5. **Fully transparent** - safe to open-source

## Common Tasks

### Add Gemini (Free)
1. Go to https://aistudio.google.com/apikey
2. Create API key
3. Copy key
4. Settings → API Keys → Gemini
5. Paste and Save

### Add OpenAI (Paid)
1. Go to https://platform.openai.com/api-keys  
2. Create API key
3. Copy key
4. Settings → API Keys → OpenAI
5. Paste and Save

### Use Ollama (Local)
1. Install Ollama
2. Run: `ollama serve`
3. Settings → API Keys → Ollama
4. Endpoint: http://localhost:11434
5. Save (no key needed)

### Check What's Configured
```javascript
// Browser console:
const s = JSON.parse(localStorage.getItem('core_dna_settings'));
Object.entries(s.llms).forEach(([k, v]) => {
  console.log(`${k}: ${v.apiKey ? '✓ configured' : '✗ not set'}`);
});
```

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "API key not configured" | No key in Settings | Add key in Settings → API Keys |
| "Network error" | Provider API down | Check internet, try later |
| "Invalid API key" | Wrong key | Get correct key from provider |
| "Quota exceeded" | Used up free tier | Upgrade provider plan |

## Performance

- Gemini: 5-15 seconds
- OpenAI: 5-20 seconds  
- Claude: 5-15 seconds
- Ollama (local): 10-60 seconds

## Support

1. Check console for error message
2. Read TESTING_API_FIXES.md
3. Verify API key is valid
4. Try different provider if stuck

## Done!

All API configuration issues fixed. CoreDNA2 now uses proper BYOK security model.
