# CoreDNA2 Provider Categorization Audit

## Summary

This audit verifies that all AI providers are correctly categorized and routed through appropriate APIs.

## Categories Defined

### 1. **TEXT LLM** (`settings.llms`)
For text generation, analysis, reasoning - used by:
- Extract Brand DNA
- Find Leads
- Closer Agent
- Campaign Generation
- Battle Simulation
- Trend Pulse

### 2. **IMAGE GENERATION** (`settings.image`)
For image/visual generation only

### 3. **VIDEO GENERATION** (`settings.video`)
For video/motion generation only

### 4. **VOICE/TTS** (`settings.voice`)
For text-to-speech/voice synthesis only

### 5. **WORKFLOWS** (`settings.workflows`)
For automation/integration webhooks only

---

## TEXT LLM Providers (Extraction Feature Uses These)

✅ **CORRECT** - All text-capable providers:
- google (Gemini) ✓
- openai (GPT) ✓
- anthropic (Claude) ✓
- mistral ✓
- xai (Grok) ✓
- deepseek ✓
- groq ✓
- together ✓
- openrouter ✓
- perplexity ✓
- qwen (Alibaba) ✓
- cohere ✓
- meta_llama ✓
- microsoft (Azure OpenAI) ✓
- ollama (Local) ✓
- custom_openai ✓
- sambanova ✓
- cerebras ✓
- hyperbolic ✓
- nebius ✓
- aws_bedrock ✓
- friendli ✓
- replicate_llm ✓
- minimax ✓
- hunyuan (LLM) ✓
- blackbox ✓
- dify ✓
- venice ✓
- zai ✓
- comet ✓
- huggingface ✓

---

## IMAGE PROVIDERS (Image Generation Only)

✅ **CORRECT** - All image-only providers:
- google (Imagen) ✓
- openai (DALL-E 3) ✓
- openai_dalle_next (DALL-E 4) ✓
- stability (Stable Diffusion) ✓
- sd3 (Stable Diffusion 3) ✓
- fal_flux (Flux) ✓
- midjourney ✓
- runware ✓
- leonardo ✓
- recraft ✓
- xai (Image) ✓
- amazon (Titan) ✓
- adobe (Firefly) ✓
- deepai ✓
- replicate (Image) ✓
- bria ✓
- segmind ✓
- prodia ✓
- ideogram ✓
- black_forest_labs (Flux) ✓
- wan (Image) ✓
- hunyuan_image ✓

---

## VIDEO PROVIDERS (Video Generation Only)

✅ **CORRECT** - All video-only providers:
- sora2 (OpenAI Sora 2) ✓
- veo3 (Google Veo 3) ✓
- runway (Runway Gen-4) ✓
- kling (Kling AI 2.6) ✓
- luma (Luma Dream Machine) ✓
- ltx2 (Lightricks LTX-2) ✓
- wan_video (Wan 2.6) ✓
- hunyuan_video (HunyuanVideo) ✓
- mochi (Mochi) ✓
- seedance (Seedance 1.5) ✓
- pika (Pika Labs) ✓
- hailuo (Hailuo 2.3) ✓
- pixverse ✓
- higgsfield ✓
- heygen (HeyGen) ✓
- synthesia ✓
- deepbrain (DeepBrain AI) ✓
- colossyan ✓
- replicate_video (Replicate) ✓
- fal (fal.ai) ✓
- fireworks (Fireworks.ai) ✓
- wavespeed (WaveSpeedAI) ✓

---

## VOICE/TTS PROVIDERS (Voice Synthesis Only)

✅ **CORRECT** - All voice-only providers:
- elevenlabs ✓
- openai (TTS) ✓
- playht ✓
- cartesia ✓
- resemble ✓
- murf ✓
- wellsaid ✓
- deepgram ✓
- lmnt ✓
- fish (Fish Audio) ✓
- rime ✓
- neets ✓
- speechify ✓
- amazon_polly ✓
- google_tts ✓
- azure (Speech) ✓
- piper (Local) ✓
- custom ✓

---

## Extraction Feature Routing

### Current Implementation ✅

**File**: `services/geminiService.ts`

```typescript
const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  // PRIORITY 1: Use explicitly set activeLLM if it has API key
  if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
    return settings.activeLLM;
  }
  
  // PRIORITY 2: Find first LLM with API key in settings.llms
  if (settings.llms) {
    for (const [key, config] of Object.entries(settings.llms)) {
      const llmConfig = config as any;
      if (llmConfig.apiKey && llmConfig.apiKey.trim()) {
        return key;
      }
    }
  }
  
  throw new Error('No LLM provider configured...');
};
```

### Features Using Text LLM API ✅

1. **Brand DNA Extraction** (`analyzeBrandDNA`)
   - Routes through: `getActiveLLMProvider()`
   - Uses: `settings.llms[provider].apiKey`

2. **Lead Discovery** (`findLeadsWithMaps`)
   - Routes through: `getActiveLLMProvider()`
   - Uses: `settings.llms[provider].apiKey`

3. **Closer Agent** (`runCloserAgent`)
   - Routes through: `getActiveLLMProvider()`
   - Uses: `settings.llms[provider].apiKey`

4. **Campaign Generation** (`generateCampaignAssets`)
   - Routes through: `getActiveLLMProvider()`
   - Uses: `settings.llms[provider].apiKey`

5. **Battle Simulation** (`runBattleSimulation`)
   - Routes through: `getActiveLLMProvider()`
   - Uses: `settings.llms[provider].apiKey`

6. **Trend Pulse** (`generateTrendPulse`)
   - Routes through: `getActiveLLMProvider()`
   - Uses: `settings.llms[provider].apiKey`

### Image Generation Routing ✅

**Function**: `generateAssetImage`
```typescript
export const generateAssetImage = (prompt: string) => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  if (!settings.activeImageGen) {
    throw new Error('No image generation provider configured...');
  }
  // Uses activeImageGen from settings.image section
  return geminiService.generate(settings.activeImageGen, ...);
};
```

---

## Verification Checklist

✅ **LLM Section** - Contains only text-generation providers
✅ **Image Section** - Contains only image-generation providers  
✅ **Video Section** - Contains only video-generation providers
✅ **Voice Section** - Contains only voice/TTS providers
✅ **Extraction Feature** - Routes through `getActiveLLMProvider()` (text LLM only)
✅ **Duplicate Keys Fixed** - wan, hunyuan, replicate renamed to video variants
✅ **Provider Routing** - Each feature uses correct provider category

---

## No Issues Found

All providers are correctly categorized and the extraction feature properly routes through the text LLM API.

Current Status: **✅ CORRECT**
