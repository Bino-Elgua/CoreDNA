# Quick Diagnosis - Run These in Browser Console

## Test 1: Check if API Keys Exist
```javascript
const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log('Settings exist:', !!settings.llms);
console.log('LLM providers configured:', Object.keys(settings.llms || {}));
console.log('Has API keys:', Object.keys(settings.llms || {}).map(p => `${p}: ${settings.llms[p].apiKey ? '✓' : '✗'}`));
```

## Test 2: Check Saved Profiles
```javascript
const profiles = JSON.parse(localStorage.getItem('core_dna_profiles') || '[]');
console.log('Saved profiles:', profiles.length);
console.log('Latest profile:', profiles[0]);
```

## Test 3: Manually Test API Call
```javascript
// After clicking Extract, look for these in Console:
// Should see: [getActiveLLMProvider] logs
// Should see: [analyzeBrandDNA] Raw response logs
// Should see: [analyzeBrandDNA] Parsed successfully logs

// If not seeing logs, API call didn't start
```

## Test 4: Check Specific Field Values
```javascript
const profile = JSON.parse(localStorage.getItem('core_dna_profiles') || '[]')[0];
if (profile) {
  console.log('Name:', profile.name);
  console.log('Tagline:', profile.tagline);
  console.log('Description length:', profile.description?.length);
  console.log('Colors count:', profile.colors?.length);
  console.log('Values:', profile.values);
  console.log('Confidence scores:', profile.confidenceScores);
} else {
  console.log('No profiles saved yet');
}
```

## Test 5: Simulate Extraction (if logged in)
```javascript
// Only run if you know how to use Dev Tools
// This simulates what ExtractPage.handleExtractDNA does

import { analyzeBrandDNA } from './services/geminiService';

// Test with famous brand
analyzeBrandDNA('https://www.apple.com', 'Apple')
  .then(dna => {
    console.log('✓ Extraction successful');
    console.log('Result:', dna);
  })
  .catch(err => {
    console.error('✗ Extraction failed:', err.message);
  });
```

## Expected Output When Working

### Console Logs Should Show:
```
[getActiveLLMProvider] Detecting active LLM provider...
[getActiveLLMProvider] ✓ Using first available LLM: openai
[analyzeBrandDNA] Raw response: {"id":"uuid-...", "name":"Apple", ...}
[analyzeBrandDNA] Parsed successfully: Apple
```

### Saved Profile Should Have:
```javascript
{
  id: "dna_1234567890",
  name: "Apple",           // ← Not empty
  tagline: "...",          // ← Not empty
  description: "...",      // ← Not empty
  mission: "...",          // ← Not empty
  values: [...],           // ← Not empty array
  colors: [...],           // ← Not empty array
  fonts: [...],            // ← Not empty array
  confidenceScores: {
    visuals: 75,           // ← Numbers, not 0
    strategy: 75,
    tone: 75,
    overall: 75
  }
}
```

### If Fields Are Empty:
```javascript
{
  id: "dna_1234567890",
  name: "Apple",
  tagline: "",             // ← EMPTY - parse failed?
  description: "",         // ← EMPTY
  mission: "",             // ← EMPTY
  values: [],              // ← EMPTY ARRAY
  colors: [],              // ← EMPTY ARRAY
  confidenceScores: {
    visuals: 50,           // ← Fallback values (50)
    strategy: 50,
    tone: 50,
    overall: 50
  }
}
```

## Root Causes If Blank:

1. **JSON Parse Failed**
   - Console will show: `[analyzeBrandDNA] Parse error: ...`
   - LLM response wasn't valid JSON
   - Fallback values used (visuals: 50, etc.)

2. **API Key Missing**
   - Console will show: `[getActiveLLMProvider] ✗ No LLM provider...`
   - Settings not saved or API key invalid

3. **API Request Failed**
   - Check Network tab in DevTools
   - Look for failed request to api.openai.com (or other provider)
   - Error will be in response body

4. **Network Timeout**
   - Request never completes
   - Browser keeps loading
   - Check Network tab for pending requests
