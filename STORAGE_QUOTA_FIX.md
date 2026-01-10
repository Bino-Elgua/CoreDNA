# localStorage Quota Exceeded - Fix

## Problem
**Error**: "Setting the value of 'core_dna_settings' exceeded the quota"

This means the settings object is too large to store in browser storage.

---

## Immediate Fix (2 minutes)

### Step 1: Open Browser Console
- Press F12
- Go to Console tab

### Step 2: Clear Storage (Copy & Paste)

```javascript
// Clear the problematic settings
localStorage.removeItem('core_dna_settings');

// Clear cache
localStorage.removeItem('core_dna_profiles');
localStorage.removeItem('settingsCache');

// Verify cleared
console.log('localStorage size:', new Blob(Object.values(localStorage)).size, 'bytes');

// Reload page
location.reload();
```

### Step 3: Start Fresh
1. Page will reload
2. Settings will be empty (default)
3. Go to Settings → LLM
4. Add just ONE API key (don't add all 30+)
5. Click Save
6. Try extraction

---

## Why This Happens

localStorage has a 5-10MB limit per domain.

The settings object grows when:
- You add API keys for many providers (31 LLM providers = big object)
- Past extraction results are stored
- Profile data accumulates
- Settings are saved repeatedly with data duplication

**Solution**: Don't store everything. Store minimal config.

---

## Prevention: Optimize Settings

The app should only save:
```javascript
{
  "activeLLM": "google",
  "llms": {
    "google": { 
      "provider": "google", 
      "apiKey": "YOUR_KEY"
    }
  }
}
```

NOT all 31 provider configs. Currently it saves:
```javascript
{
  "llms": {
    "google": {...},
    "openai": {...},
    "anthropic": {...},
    // ... 28 more empty providers
  },
  "image": { ... 22 providers },
  "video": { ... 22 providers },
  "voice": { ... 18 providers },
  "workflows": { ... 11 providers }
  // = MASSIVE object
}
```

---

## Better Approach: Code Fix

**File to modify**: `pages/SettingsPage.tsx`

**Current (saves everything)**:
```typescript
await saveSettings(settings);  // Saves all 135 providers
```

**Should be**:
```typescript
// Only save configured providers (not all 135)
const configuredSettings = {
  activeLLM: settings.activeLLM,
  activeImageGen: settings.activeImageGen,
  activeVideo: settings.activeVideo,
  activeVoice: settings.activeVoice,
  activeWorkflow: settings.activeWorkflow,
  llms: Object.fromEntries(
    Object.entries(settings.llms)
      .filter(([k, v]) => (v as any).apiKey)  // Only with keys
  ),
  image: Object.fromEntries(
    Object.entries(settings.image)
      .filter(([k, v]) => (v as any).apiKey)
  ),
  // ... same for video, voice
};
await saveSettings(configuredSettings);
```

This would reduce from 50KB to 1-5KB.

---

## Quick Workaround

For now, only add ONE API key:
1. Go to Settings → LLM
2. Select Google Gemini
3. Add JUST Google API key
4. Don't add OpenAI, Claude, etc.
5. Save

This keeps settings small and won't exceed quota.

---

## Check Storage Size

In console:
```javascript
const size = new Blob([localStorage.getItem('core_dna_settings')]).size;
console.log('Settings size:', size, 'bytes');
console.log('Is over 1MB?', size > 1000000);
```

Should be < 5KB (just one API key)
Currently probably > 100KB (all empty providers)

---

## Long-term Solution

Modify `settingsService.ts` to:
1. Only save non-default values
2. Compress settings before saving
3. Use IndexedDB instead (larger quota)
4. Split settings across multiple keys

But for now, the console clear + single API key should work.

---

## Test It Worked

After clearing and reloading:
```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log('Settings restored:', Object.keys(s));
console.log('Size:', new Blob([JSON.stringify(s)]).size);
```

Should show small size and minimal keys.

---

## If Still Getting Error

1. Clear browser cache (Ctrl+Shift+Del)
2. Close browser completely
3. Reopen browser
4. Try again
5. If still fails, use Incognito/Private window (clean storage)

---

**Status**: Fixable in 2 minutes with console command
