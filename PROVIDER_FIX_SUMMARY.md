# Provider Selection Fix Summary

## Problem
User was getting "exceeded Gemini quota" errors even though they had configured Mistral as their LLM provider. This was because the code had multiple places where it was calling `geminiService.generate()` without passing a provider parameter, causing it to default to Gemini internally.

## Root Causes Found & Fixed

### 1. **Wrapper Functions Without Provider Parameter** (geminiService.ts)
The following wrapper functions were calling `geminiService.generate()` without passing the provider:

- `generateAgentSystemPrompt()`
- `runBattleSimulation()`
- `analyzeUploadedAssets()`
- `optimizeSchedule()`
- `generateTrendPulse()`
- `refineAssetWithAI()`
- `universalGenerate()` - **This was the critical one causing most errors**

**Fix**: Modified all functions to call `getActiveLLMProvider()` first and pass the provider to `geminiService.generate()`.

### 2. **Sonic CoPilot Hardcoded Gemini Calls** (src/services/sonicCoPilot.ts)
Two direct hardcoded calls to Gemini:

- Line 96: `geminiService.generate('gemini', prompt, ...)`
- Line 197: `geminiService.generate('gemini', \`Extract brand DNA...\`, ...)`

**Fix**: 
- Added `getActiveLLMProvider()` helper function to sonicCoPilot.ts
- Modified both calls to use the selected provider instead of hardcoded 'gemini'

### 3. **Gemini Quota Error Fallback** (geminiService.ts)
Line 570 was defaulting to 'gemini' if no provider was configured:

```typescript
// BEFORE (WRONG)
return 'gemini';

// AFTER (CORRECT)
throw new Error('No LLM provider configured. Please select an LLM provider in Settings and add its API key.');
```

### 4. **Image Generation Hardcoded Default** (geminiService.ts)
Line 598 was defaulting to 'openai' for image generation:

```typescript
// BEFORE (WRONG)
const provider = settings.activeImageGen || 'openai';

// AFTER (CORRECT)
if (!settings.activeImageGen) {
  throw new Error('No image generation provider configured...');
}
```

### 5. **TTS Provider Hardcoded Default** (siteGeneratorService.ts)
Line 435 was defaulting to 'elevenlabs' for voice:

```typescript
// BEFORE (WRONG)
ttsProvider: settings?.activeVoice || 'elevenlabs'

// AFTER (CORRECT)
if (voiceEnabled && !settings?.activeVoice) {
  throw new Error('Voice mode enabled but no TTS provider configured...');
}
ttsProvider: settings?.activeVoice
```

## Files Modified

1. **services/geminiService.ts** - 8 wrapper functions + default fallback + image provider
2. **src/services/sonicCoPilot.ts** - Added getActiveLLMProvider helper + 2 hardcoded calls
3. **services/siteGeneratorService.ts** - TTS provider validation
4. **components/ApiKeysSection.tsx** - Enhanced "Get API Key" button visibility

## How Provider Selection Works Now

### Priority Order for LLM Provider Selection:
1. User's explicitly selected `activeLLM` from Settings (if configured)
2. First LLM with API key in Settings
3. First LLM with API key in BYOK localStorage
4. **ERROR** if nothing configured (no default fallback)

### Why This Matters
- Before: Gemini was always the fallback, causing quota errors
- After: User must explicitly configure a provider; no silent fallback

## Testing the Fix

1. Go to Settings → LLM Providers
2. Select **Mistral** from "Primary LLM" dropdown
3. Add your Mistral API key
4. Perform any action that uses LLM:
   - Extract Brand DNA
   - Generate campaign assets
   - Run battle simulation
   - Refine assets
5. Monitor network requests - should see Mistral API calls, not Gemini

## Error Messages Users Will See

If misconfigured:
- **No LLM**: "No LLM provider configured. Please select an LLM provider in Settings..."
- **No Image Gen**: "No image generation provider configured. Please select an image provider..."
- **No Voice (when enabled)**: "Voice mode enabled but no TTS provider configured..."

These errors are **intentional** - they force proper configuration instead of failing silently.
