# How to Save API Key in Settings (Step by Step)

## The Problem
You added an API key but the app still says "add an API key in Settings."

## Why This Happens
The API key might not have been saved to browser storage yet.

---

## CORRECT PROCEDURE

### Step 1: Open Settings
1. Click "⚙️ Settings" in the app
2. Make sure you're on the **LLM** tab

### Step 2: Add Primary LLM
1. Find the dropdown labeled **"Primary LLM Engine"**
2. Click it and select **"Google Gemini"** (or another LLM)
3. The provider card should appear below with a toggle

### Step 3: Enable the Provider
1. Find the card for "Google Gemini" (or your chosen provider)
2. Click the **green toggle** on the right side to enable it
3. The card should expand

### Step 4: Enter API Key
1. Look for the field labeled **"API Key"** (should show ●●●●●● placeholder)
2. Click the field and paste your API key there
3. **IMPORTANT**: Make sure the full key is pasted (it's a password field)

### Step 5: WAIT for Auto-Save
1. After you paste the key, **WAIT at least 2-3 seconds**
2. You should see a brief message like "Settings auto-saved" in browser console
3. OR manually click the **"Save Settings"** button at the bottom

### Step 6: Verify It Saved
1. **Option A**: See the message popup ("Settings saved successfully...")
2. **Option B**: Open browser console (F12) and run:
   ```javascript
   JSON.parse(localStorage.getItem('core_dna_settings')).llms.google.apiKey
   ```
   Should show your actual API key

---

## Common Mistakes

### ❌ Mistake 1: Not waiting for auto-save
- **Problem**: You paste key and immediately navigate away
- **Fix**: Wait 2-3 seconds after typing/pasting before leaving the page
- **Check**: Watch for "auto-saved" message in console

### ❌ Mistake 2: Using wrong provider name
- **Problem**: Settings shows "OpenAI" but the system looks for "openai"
- **Fix**: Match exactly what's shown in the SettingsPage (check type in code)
- **Check**: Console will log which provider it's looking for

### ❌ Mistake 3: API key has spaces
- **Problem**: Your API key accidentally has space before/after
- **Fix**: Triple check - copy key, paste in notepad, check for spaces, copy from notepad
- **Check**: Use `apiKey.trim()` test in console

### ❌ Mistake 4: Provider not enabled
- **Problem**: Card is there but toggle is OFF (gray)
- **Fix**: Click the toggle to turn it GREEN/ON
- **Check**: Card should expand when enabled

### ❌ Mistake 5: Browser cache issue
- **Problem**: Old settings still in memory
- **Fix**: Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Check**: Settings should reset to defaults

---

## The Exact Flow

```
You type API key
    ↓
updateProvider() updates React state
    ↓
setHasChanges(true)
    ↓
useEffect detects hasChanges (after 2 seconds)
    ↓
saveSettings() called
    ↓
localStorage.setItem('core_dna_settings', JSON.stringify(settings))
    ↓
window.dispatchEvent('settingsUpdated')
    ↓
✓ Key is now in browser storage
```

---

## Verification Checklist

Before trying extraction, verify ALL of these:

- [ ] Settings page loaded successfully
- [ ] LLM tab is selected
- [ ] Provider dropdown shows a selection
- [ ] Provider card is visible
- [ ] Provider toggle is GREEN/ON
- [ ] API Key field has your actual key (not empty)
- [ ] You waited 2+ seconds after typing OR clicked Save button
- [ ] Console shows "Settings saved" message
- [ ] Browser console: `localStorage.getItem('core_dna_settings')` shows your key

---

## Test If It Worked

### In Browser Console:
```javascript
// Should show your settings object:
const s = JSON.parse(localStorage.getItem('core_dna_settings'));
console.log('LLM Settings:', s.llms);
console.log('Active LLM:', s.activeLLM);
console.log('Has Google key:', s.llms.google?.apiKey ? 'YES' : 'NO');
```

Should output something like:
```
LLM Settings: {
  google: { provider: 'google', enabled: true, apiKey: 'AIzaSyD...abc123' },
  openai: { provider: 'openai', enabled: false, apiKey: '' },
  ...
}
Active LLM: google
Has Google key: YES
```

---

## If Still Not Working

1. **Check provider name**: 
   - Does `s.llms` have the key you added? (e.g., "google")
   - Is the key spelled correctly?

2. **Check activation**:
   - Is `enabled: true` set?
   - Is `activeLLM` set to the provider you configured?

3. **Check API key**:
   - Is it an actual non-empty string?
   - Does it look right (should start with proper prefix for your provider)?

4. **Nuclear option - Reset everything**:
   ```javascript
   // In console:
   localStorage.removeItem('core_dna_settings');
   location.reload();
   ```
   Then redo Steps 1-6 above carefully

---

## Still Not Working? Debug Mode

Add this to browser console to see exactly what's happening:

```javascript
// Check what provider the app is looking for:
const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log('Full settings:', JSON.stringify(settings, null, 2));

// Check what getActiveLLMProvider would return:
if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
  console.log('Would use activeLLM:', settings.activeLLM);
} else {
  for (const [key, config] of Object.entries(settings.llms || {})) {
    if (config.apiKey && config.apiKey.trim()) {
      console.log('Would use first available:', key);
      break;
    }
  }
}
```

This shows exactly which provider will be used (or if none match).

---

**Status**: Ready to debug once you verify above checklist
