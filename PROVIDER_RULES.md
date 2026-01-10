# Provider Selection Rules for CoreDNA2

## Core Rules

1. **NEVER default to Gemini or any hardcoded provider**
   - Users must explicitly select their provider in Settings
   - The app should throw an error if no provider is configured, forcing the user to set one

2. **ALWAYS route requests through the currently selected provider in Settings**
   - Check `settings.activeLLM`, `settings.activeImageGen`, `settings.activeVoice`, `settings.activeVideo`, and `settings.activeWorkflow`
   - These are the single source of truth for provider selection

3. **If the selected provider requires a specific model name, use the one configured in Settings**
   - Default models are defined in `SettingsPage.tsx` INITIAL_SETTINGS
   - Always use `settings.llms[provider].defaultModel` when making API calls

4. **If the provider is "vercel", use the Vercel AI Gateway with the model selected in Settings**
   - Route requests to the Vercel AI Gateway endpoint
   - Include the model selection from settings

5. **Do not mention or suggest changing the provider unless the user explicitly asks**
   - Keep UI focused on the current provider
   - Don't show "upgrade provider" suggestions

## Implementation Details

### LLM Provider Selection (`getActiveLLMProvider()`)

Located in: `services/geminiService.ts`

Priority order:
1. **PRIORITY 1**: Use explicitly set `activeLLM` from Settings if it has an API key
2. **PRIORITY 2**: Find first enabled LLM with API key in Settings
3. **PRIORITY 3**: Check BYOK (localStorage) for any configured LLM provider
4. **ERROR**: Throw error if no provider found (never default)

```typescript
// Example from getActiveLLMProvider():
if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
  return settings.activeLLM;
}
// ... continue checking
throw new Error('No LLM provider configured. Please select an LLM provider in Settings and add its API key.');
```

### Image Generation Provider Selection

Located in: `services/geminiService.ts` - `generateAssetImage()`

```typescript
// BEFORE (WRONG):
const provider = settings.activeImageGen || 'openai'; // ❌ Defaults to OpenAI

// AFTER (CORRECT):
if (!settings.activeImageGen) {
  throw new Error('No image generation provider configured...');
}
return geminiService.generate(settings.activeImageGen, ...);
```

### Voice/TTS Provider Selection

Located in: `services/siteGeneratorService.ts` - `extractSonicConfig()`

```typescript
// BEFORE (WRONG):
ttsProvider: settings?.activeVoice || 'elevenlabs', // ❌ Defaults to ElevenLabs

// AFTER (CORRECT):
if (voiceEnabled && !settings?.activeVoice) {
  throw new Error('Voice mode enabled but no TTS provider configured...');
}
return { ttsProvider: settings?.activeVoice, ... };
```

## Settings Structure

All provider selections are stored in `GlobalSettings` (see `types.ts`):

```typescript
interface GlobalSettings {
  activeLLM: string;           // e.g., 'openai', 'claude', 'groq'
  activeImageGen: string;      // e.g., 'openai', 'stability', 'google'
  activeVoice: string;         // e.g., 'elevenlabs', 'openai', 'playht'
  activeVideo: string;         // e.g., 'ltx2', 'runway', 'sora2'
  activeWorkflow: string;      // e.g., 'n8n', 'zapier', 'make'
  
  llms: Record<string, LLMConfig>;     // Provider-specific configs
  image: Record<string, ImageConfig>;  // Provider-specific configs
  voice: Record<string, VoiceConfig>;  // Provider-specific configs
  video: Record<string, VideoConfig>;  // Provider-specific configs
  workflows: Record<string, WorkflowConfig>; // Provider-specific configs
}
```

## API Key Routes (ApiKeysSection.tsx)

Each provider has a configured route to get an API key:

```typescript
// Example providers with routes
{ id: 'groq', name: 'Groq', link: 'https://console.groq.com/keys', free: true },
{ id: 'openai', name: 'OpenAI (GPT-4o)', link: 'https://platform.openai.com/api-keys' },
{ id: 'claude', name: 'Anthropic Claude', link: 'https://console.anthropic.com/settings/keys' },
```

The "🔑 Get API Key" button routes users to the correct provider site to obtain credentials.

## Testing Provider Selection

### LLM Test Case
1. Go to Settings → LLM Providers
2. Select "Groq" from "Primary LLM" dropdown
3. Add your Groq API key
4. Perform an action that requires LLM (e.g., Extract Brand DNA)
5. Verify request uses Groq, not Gemini

### Error Case
1. Go to Settings → LLM Providers
2. Don't configure any LLM provider
3. Try to Extract Brand DNA
4. Should error: "No LLM provider configured..."

## Files Modified

- `services/geminiService.ts` - Fixed LLM and image provider selection
- `services/siteGeneratorService.ts` - Fixed TTS provider selection
- `components/ApiKeysSection.tsx` - Enhanced "Get API Key" button visibility

## Future Work

- Add provider-specific model validation (e.g., only show valid models for selected provider)
- Add health checks to verify selected provider is properly configured before operations
- Add provider-specific error messages (e.g., "Groq API rate limited, try another provider")
