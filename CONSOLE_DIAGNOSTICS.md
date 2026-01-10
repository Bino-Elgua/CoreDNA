# Console Diagnostics - Copy & Paste Commands

Open browser console (F12 → Console tab) and copy-paste these commands one by one.

---

## 1. Check if Settings are Saved

```javascript
JSON.parse(localStorage.getItem('core_dna_settings') || '{}')
```

**What to look for**: Should show an object with `llms`, `image`, `voice`, etc.

---

## 2. Check All LLM Providers

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log(Object.keys(s.llms || {}));
```

**What to look for**: Should list all provider names (google, openai, anthropic, etc.)

---

## 3. Check Which LLM is Active

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log('Active LLM:', s.activeLLM);
```

**What to look for**: Should show provider name like "google" or "openai"

---

## 4. Check if Your Chosen Provider Has an API Key

Replace `google` with your provider name:

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
const provider = 'google'; // Change this
console.log(`${provider} API Key:`, s.llms[provider]?.apiKey || 'NOT FOUND');
```

**What to look for**: Should show either your actual API key OR "NOT FOUND"

---

## 5. Check API Key Length

If key exists, check its length:

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
const key = s.llms.google?.apiKey;
console.log('Key length:', key?.length || 0);
console.log('Key is empty:', !key || key.trim() === '');
```

**What to look for**: 
- Length should be >0
- "Key is empty" should be false

---

## 6. Simulate What getActiveLLMProvider Does

This mimics exactly what the app checks:

```javascript
const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');

console.log('--- Simulating getActiveLLMProvider ---');

// Check 1: activeLLM with API key?
if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
  console.log('✓ FOUND: activeLLM =', settings.activeLLM);
  console.log('  → Would use provider:', settings.activeLLM);
} else {
  console.log('✗ activeLLM check failed');
  console.log('  activeLLM:', settings.activeLLM);
  console.log('  Has key:', settings.llms?.[settings.activeLLM]?.apiKey ? 'YES' : 'NO');
}

// Check 2: First LLM with API key?
console.log('\n--- Checking for first available LLM ---');
if (settings.llms) {
  let found = false;
  for (const [key, config] of Object.entries(settings.llms)) {
    if (config.apiKey && config.apiKey.trim()) {
      console.log('✓ FOUND:', key);
      console.log('  → Would use provider:', key);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('✗ No LLM with API key found');
    console.log('  Available providers:', Object.keys(settings.llms));
  }
} else {
  console.log('✗ No llms section in settings');
}
```

**What to look for**: Should say "FOUND" for at least one provider

---

## 7. Get Full Provider Config

See everything the app knows about your chosen provider:

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log(JSON.stringify(s.llms.google, null, 2));
```

**What to look for**: Should show structure like:
```json
{
  "provider": "google",
  "enabled": true,
  "apiKey": "AIzaSyD..."
}
```

---

## 8. Check If Settings Auto-Saved Recently

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log('Last update visible in storage:', new Date().toLocaleString());
console.log('Settings object keys:', Object.keys(s));
```

---

## 9. Test Provider Name Matching

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
const testProviders = ['google', 'openai', 'anthropic', 'mistral'];

testProviders.forEach(provider => {
  const hasKey = s.llms?.[provider]?.apiKey ? 'YES' : 'NO';
  const isEnabled = s.llms?.[provider]?.enabled ? 'YES' : 'NO';
  console.log(`${provider}: enabled=${isEnabled}, hasKey=${hasKey}`);
});
```

---

## 10. List All Providers with API Keys

```javascript
const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
const withKeys = Object.entries(s.llms || {})
  .filter(([k, v]: any) => v.apiKey && v.apiKey.trim())
  .map(([k]: any) => k);

console.log('Providers with API keys:', withKeys.length > 0 ? withKeys : 'NONE');
```

**What to look for**: Should list at least one provider name

---

## 11. Monitor Auto-Save

Paste this BEFORE you add API key, then add key to watch auto-save happen:

```javascript
// Monitor when settings change
setInterval(() => {
  const now = new Date().toLocaleTimeString();
  const s = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  const hasKey = s.llms?.google?.apiKey ? 'YES' : 'NO';
  console.log(`[${now}] Google key: ${hasKey}`);
}, 1000);

// This will print every second
// Stop it by closing console or refreshing page
```

---

## 12. Check Network Requests

When you try to extract DNA:

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by `google` or `openai` or your provider
4. Try extraction
5. You should see request to provider API
6. Check response for errors

---

## If All Checks Fail

Try this nuclear reset:

```javascript
// 1. Clear settings
localStorage.removeItem('core_dna_settings');
console.log('Settings cleared');

// 2. Reload page
location.reload();

// 3. Browser will reload with fresh settings
// Then redo: Settings → Add API key → Save
```

---

## Troubleshooting Matrix

| Symptom | Command to Run | Expected | Actual | Fix |
|---------|---|---|---|---|
| App says no API key | #6 | FOUND | ✗ NOT FOUND | Add API key + save |
| Key is empty | #5 | length > 0 | length = 0 | Paste key again |
| Provider name wrong | #2 | matches your choice | doesn't match | Check spelling |
| Settings lost | #1 | full object | {} | Do reset (#12) |
| Not auto-saving | #11 | YES → YES every sec | no change | Check console for errors |

---

## After You Fix It

Verify with this one-liner:

```javascript
const s=JSON.parse(localStorage.getItem('core_dna_settings')||'{}');[['google','openai','anthropic'].filter(p=>s.llms[p]?.apiKey?.trim()).shift()||'NONE']
```

Should output a provider name, not "NONE"

---

**Report**: Copy the output of these commands and we can debug together
