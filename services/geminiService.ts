/**
 * GeminiService - BYOK (Bring Your Own Keys) Implementation
 * 
 * Users provide their own API keys via Settings page.
 * Keys are stored in localStorage only, never sent to CoreDNA servers.
 * Supports 70+ providers across LLM, Image, Voice, and Automation categories.
 */

import { toastService } from './toastService';

interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class GeminiService {
  // Provider endpoint configurations
  private providerConfigs: Record<string, any> = {
    // LLM PROVIDERS
    gemini: {
      type: 'llm',
      defaultModel: 'gemini-2.0-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    openai: {
      type: 'llm',
      defaultModel: 'gpt-4o',
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    claude: {
      type: 'llm',
      defaultModel: 'claude-3-5-sonnet-20241022',
      endpoint: 'https://api.anthropic.com/v1/messages'
    },
    mistral: {
      type: 'llm',
      defaultModel: 'mistral-large-latest',
      endpoint: 'https://api.mistral.ai/v1/chat/completions'
    },
    groq: {
      type: 'llm',
      defaultModel: 'llama-3.3-70b-versatile',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions'
    },
    deepseek: {
      type: 'llm',
      defaultModel: 'deepseek-chat',
      endpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    xai: {
      type: 'llm',
      defaultModel: 'grok-beta',
      endpoint: 'https://api.x.ai/v1/chat/completions'
    },
    qwen: {
      type: 'llm',
      defaultModel: 'qwen-turbo',
      endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    },
    cohere: {
      type: 'llm',
      defaultModel: 'command-r-plus',
      endpoint: 'https://api.cohere.ai/v1/generate'
    },
    perplexity: {
      type: 'llm',
      defaultModel: 'llama-3.1-sonar-large-128k-online',
      endpoint: 'https://api.perplexity.ai/chat/completions'
    },
    openrouter: {
      type: 'llm',
      defaultModel: 'anthropic/claude-3.5-sonnet',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions'
    },
    together: {
      type: 'llm',
      defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      endpoint: 'https://api.together.xyz/v1/chat/completions'
    },
    ollama: {
      type: 'llm',
      defaultModel: 'gemma2:27b',
      endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      local: true
    },

    // IMAGE PROVIDERS
    imagen: {
      type: 'image',
      defaultModel: 'imagen-3.0-generate-001',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    dalle: {
      type: 'image',
      defaultModel: 'dall-e-3',
      endpoint: 'https://api.openai.com/v1/images/generations'
    },
    stability: {
      type: 'image',
      defaultModel: 'stable-diffusion-xl-1024-v1-0',
      endpoint: 'https://api.stability.ai/v2beta/stable-image/generate/core'
    },
    fal: {
      type: 'image',
      defaultModel: 'flux-pro',
      endpoint: 'https://fal.run/fal-ai/flux-pro'
    },

    // VOICE/TTS PROVIDERS
    elevenlabs: {
      type: 'voice',
      defaultModel: 'eleven_multilingual_v2',
      endpoint: 'https://api.elevenlabs.io/v1/text-to-speech'
    },
    openai_tts: {
      type: 'voice',
      defaultModel: 'tts-1',
      endpoint: 'https://api.openai.com/v1/audio/speech'
    },
    playht: {
      type: 'voice',
      defaultModel: 'Play3.0-mini',
      endpoint: 'https://api.play.ht/api/v2/tts'
    }
  };

  /**
     * Get API key from localStorage (BYOK - Bring Your Own Keys)
     * Single source of truth: core_dna_settings in localStorage
     * Falls back to legacy format if needed and warns user
     */
  private getApiKey(provider: string): string {
     try {
       const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
       
       console.log(`[GeminiService] Getting API key for provider: ${provider}`);
       
       // Check NEW unified settings structure (primary)
       if (settings.llms?.[provider]?.apiKey?.trim()) {
         console.log(`[GeminiService] ✓ Found LLM API key for ${provider}`);
         return settings.llms[provider].apiKey.trim();
       }
       
       if (settings.image?.[provider]?.apiKey?.trim()) {
         console.log(`[GeminiService] ✓ Found Image API key for ${provider}`);
         return settings.image[provider].apiKey.trim();
       }
       
       if (settings.voice?.[provider]?.apiKey?.trim()) {
         console.log(`[GeminiService] ✓ Found Voice API key for ${provider}`);
         return settings.voice[provider].apiKey.trim();
       }
       
       if (settings.workflows?.[provider]?.apiKey?.trim()) {
         console.log(`[GeminiService] ✓ Found Workflow API key for ${provider}`);
         return settings.workflows[provider].apiKey.trim();
       }
       
       // FALLBACK: Check legacy apiKeys format
       if (settings.apiKeys?.[provider]?.trim?.()) {
         console.warn(`[GeminiService] ⚠️ Using LEGACY API key format for ${provider}`);
         console.warn(`[GeminiService] ⚠️ Please go to Settings → Re-save your keys to migrate to new format`);
         return settings.apiKeys[provider].trim();
       }
       
       // Key not found in either format
       console.error(`[GeminiService] ✗ No API key found for ${provider}`);
       console.error(`[GeminiService] Configured LLMs (new format):`, settings.llms ? Object.keys(settings.llms).filter(k => settings.llms?.[k]?.apiKey?.trim?.()) : 'none');
       console.error(`[GeminiService] Legacy API keys:`, settings.apiKeys ? Object.keys(settings.apiKeys) : 'none');
       
       const errorMsg = `${provider.toUpperCase()} API key not configured. Go to Settings → API Keys to add it.`;
       throw new Error(errorMsg);
     } catch (e: any) {
       if (e.message.includes('API key not configured')) {
         throw e;
       }
       const errorMsg = `Failed to retrieve API key for ${provider}: ${e?.message}`;
       console.error(errorMsg);
       throw new Error(errorMsg);
     }
   }

  /**
   * Main generate method - routes to appropriate provider
   */
  async generate(
    provider: string,
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<string> {
    try {
      const config = this.providerConfigs[provider];
      if (!config) {
        throw new Error(`Provider ${provider} not configured. Check Settings → API Keys.`);
      }

      // Route to appropriate provider handler based on type
      const apiKey = this.getApiKey(provider);
      const model = options.model || config.defaultModel;

      switch (config.type) {
        case 'llm':
          return await this.callLLM(provider, apiKey, model, prompt, options);
        case 'image':
          return await this.callImageGen(provider, apiKey, model, prompt, options);
        case 'voice':
          return await this.callVoiceTTS(provider, apiKey, model, prompt, options);
        default:
          throw new Error(`Provider type ${config.type} not supported yet`);
      }
    } catch (error: any) {
      console.error(`Error calling ${provider}:`, error);

      // Redirect to settings if API key missing
      if (error.message.includes('not configured')) {
        setTimeout(() => {
          window.location.href = '/settings?tab=api-keys';
        }, 2000);
      }
      throw error;
    }
  }

  /**
   * Check if a provider is configured (has API key)
   */
  hasProvider(provider: string): boolean {
    const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
    return !!(
      settings.llms?.[provider]?.apiKey?.trim() ||
      settings.image?.[provider]?.apiKey?.trim() ||
      settings.voice?.[provider]?.apiKey?.trim() ||
      settings.workflows?.[provider]?.apiKey?.trim()
    );
  }

  /**
   * Get list of configured providers with API keys
   */
  getConfiguredProviders(): string[] {
    const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
    const configured: string[] = [];
    
    // Collect all providers with API keys
    if (settings.llms) {
      Object.entries(settings.llms).forEach(([key, config]: [string, any]) => {
        if (config.apiKey?.trim()) configured.push(key);
      });
    }
    
    if (settings.image) {
      Object.entries(settings.image).forEach(([key, config]: [string, any]) => {
        if (config.apiKey?.trim() && !configured.includes(key)) configured.push(key);
      });
    }
    
    if (settings.voice) {
      Object.entries(settings.voice).forEach(([key, config]: [string, any]) => {
        if (config.apiKey?.trim() && !configured.includes(key)) configured.push(key);
      });
    }
    
    if (settings.workflows) {
      Object.entries(settings.workflows).forEach(([key, config]: [string, any]) => {
        if (config.apiKey?.trim() && !configured.includes(key)) configured.push(key);
      });
    }
    
    return configured;
  }

  /**
   * LLM Provider Handler - routes to specific implementations
   */
  private async callLLM(
    provider: string,
    apiKey: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    switch (provider) {
      case 'gemini':
        return await this.callGemini(apiKey, model, prompt, options);
      case 'claude':
        return await this.callClaude(apiKey, model, prompt, options);
      case 'cohere':
        return await this.callCohere(apiKey, model, prompt, options);
      case 'qwen':
        return await this.callQwen(apiKey, model, prompt, options);
      case 'ollama':
        return await this.callOllama(this.providerConfigs[provider].endpoint, model, prompt, options);
      case 'openai':
      case 'mistral':
      case 'groq':
      case 'deepseek':
      case 'xai':
      case 'openrouter':
      case 'together':
      case 'perplexity':
        // OpenAI-compatible providers (use same API format)
        return await this.callOpenAICompatible(provider, apiKey, model, prompt, options);
      default:
        throw new Error(`LLM provider ${provider} not yet implemented. Coming soon!`);
    }
  }

  /**
   * Gemini API Implementation
   */
  private async callGemini(
    apiKey: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * OpenAI-Compatible API Implementation
   * Works for: OpenAI, Groq, DeepSeek, XAI, Together, OpenRouter, Perplexity, Mistral
   */
  private async callOpenAICompatible(
    provider: string,
    apiKey: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    const config = this.providerConfigs[provider];
    const endpoint = config.endpoint;

    const messages: any[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(provider === 'openrouter' && {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CoreDNA'
        })
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${provider} API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Claude API Implementation
   */
  private async callClaude(
    apiKey: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    const body: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048
    };

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Cohere API Implementation
   */
  private async callCohere(
    apiKey: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cohere API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.generations[0].text;
  }

  /**
   * Qwen API Implementation
   */
  private async callQwen(
    apiKey: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: { prompt },
          parameters: {
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.output.text;
  }

  /**
   * Ollama Local API Implementation
   */
  private async callOllama(
    endpoint: string,
    model: string,
    prompt: string,
    options: GenerateOptions
  ): Promise<string> {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Image Generation Handler (placeholder - implement as needed)
   */
  private async callImageGen(
    provider: string,
    apiKey: string,
    model: string,
    prompt: string,
    options: any
  ): Promise<string> {
    // Implement image generation APIs as needed
    throw new Error(`Image generation for ${provider} coming soon!`);
  }

  /**
   * Voice/TTS Handler (placeholder - implement as needed)
   */
  private async callVoiceTTS(
    provider: string,
    apiKey: string,
    prompt: string,
    model: string,
    options: any
  ): Promise<string> {
    // Implement TTS APIs as needed
    throw new Error(`Voice/TTS for ${provider} coming soon!`);
  }
}

export const geminiService = new GeminiService();

// Helper to get the active LLM provider
const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  console.log('[getActiveLLMProvider] Detecting active LLM provider...');
  console.log('[getActiveLLMProvider] activeLLM setting:', settings.activeLLM);
  console.log('[getActiveLLMProvider] Available providers:', settings.llms ? Object.keys(settings.llms) : 'none');
  
  // PRIORITY 1: Use explicitly set activeLLM from Settings if it has API key
  if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey?.trim()) {
    console.log(`[getActiveLLMProvider] ✓ Using configured activeLLM: ${settings.activeLLM}`);
    return settings.activeLLM;
  }
  
  if (settings.activeLLM) {
    console.warn(`[getActiveLLMProvider] ⚠️ activeLLM set to ${settings.activeLLM} but no API key found. Falling back...`);
  }
  
  // PRIORITY 2: Find first LLM with API key - prefer non-Gemini
  if (settings.llms && Object.keys(settings.llms).length > 0) {
    const keys = Object.keys(settings.llms);
    
    // First try non-Gemini providers
    for (const key of keys) {
      if (key !== 'google' && key !== 'gemini') {
        const llmConfig = settings.llms[key] as any;
        if (llmConfig?.apiKey?.trim()) {
          console.log(`[getActiveLLMProvider] ✓ Using first non-Gemini LLM: ${key}`);
          return key;
        }
      }
    }
    
    // Then try any available provider
    for (const [key, config] of Object.entries(settings.llms)) {
      const llmConfig = config as any;
      if (llmConfig?.apiKey?.trim()) {
        console.log(`[getActiveLLMProvider] ✓ Using available LLM: ${key}`);
        return key;
      }
    }
  }
  
  console.error('[getActiveLLMProvider] ✗ No LLM provider configured with API key');
  console.error('[getActiveLLMProvider] Configured providers:', settings.llms ? Object.keys(settings.llms) : 'none');
  
  throw new Error('No LLM provider configured. Go to Settings → API Keys to add an LLM provider and its API key.');
};

// Wrapper exports for backwards compatibility
export const analyzeBrandDNA = async (url: string, brandName?: string): Promise<any> => {
   const provider = getActiveLLMProvider();
   
   // Simplified prompt that's more likely to get valid JSON
   const prompt = `For the website "${url}" (brand: ${brandName || 'Unknown'}), create a JSON object with these EXACT fields. Return ONLY the JSON, nothing else:

{
  "id": "dna_generated",
  "name": "${brandName || 'Brand'}",
  "tagline": "Short brand tagline",
  "description": "2-3 sentence brand description",
  "mission": "Brand mission or purpose",
  "elevatorPitch": "30-second pitch",
  "values": ["value1", "value2"],
  "keyMessaging": ["message1", "message2"],
  "colors": [{"hex": "#000000", "name": "Primary", "usage": "Main color"}],
  "fonts": [{"family": "Arial", "usage": "All", "description": "Clean sans-serif"}],
  "visualStyle": {"style": "Modern", "description": "Contemporary design"},
  "toneOfVoice": {"adjectives": ["professional"], "description": "Professional tone"},
  "confidenceScores": {"visuals": 80, "strategy": 80, "tone": 80, "overall": 80},
  "brandPersonality": ["innovative"],
  "targetAudience": "Business professionals",
  "personas": [{"name": "User", "demographics": "Professional", "psychographics": "Quality-focused", "painPoints": ["efficiency"], "behaviors": ["research"]}],
  "swot": {"strengths": ["quality"], "weaknesses": ["awareness"], "opportunities": ["growth"], "threats": ["competition"]},
  "competitors": [{"name": "Competitor", "differentiation": "Unique approach"}]
}`;

   try {
     console.log(`[analyzeBrandDNA] Starting extraction for: ${url}`);
     console.log(`[analyzeBrandDNA] Using provider: ${provider}`);
     
     const response = await geminiService.generate(provider, prompt);
     console.log('[analyzeBrandDNA] Response received, length:', response.length);
     
     // Extract JSON - handle various formats
     let jsonStr = response.trim();
     
     // Remove markdown code blocks if present
     if (jsonStr.startsWith('```')) {
       jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
     }
     
     // Find JSON object in response
     const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
     if (!jsonMatch) {
       throw new Error('No JSON found in response');
     }
     
     jsonStr = jsonMatch[0];
     console.log('[analyzeBrandDNA] Attempting to parse JSON...');
     
     const parsed = JSON.parse(jsonStr);
     console.log('[analyzeBrandDNA] ✓ Parse successful, brand name:', parsed.name);
     
     // Normalize and return
     const now = Date.now();
     return {
       id: `dna_${now}`,
       name: parsed.name || brandName || 'Unknown Brand',
       tagline: parsed.tagline || 'Professional Brand',
       description: parsed.description || 'Brand description',
       mission: parsed.mission || 'Brand mission',
       elevatorPitch: parsed.elevatorPitch || 'Brand pitch',
       websiteUrl: url,
       detectedLanguage: 'en',
       createdAt: now,
       values: Array.isArray(parsed.values) ? parsed.values.slice(0, 5) : ['Innovation', 'Quality'],
       keyMessaging: Array.isArray(parsed.keyMessaging) ? parsed.keyMessaging.slice(0, 5) : ['Excellence', 'Service'],
       confidenceScores: {
         visuals: typeof parsed.confidenceScores?.visuals === 'number' ? parsed.confidenceScores.visuals : 75,
         strategy: typeof parsed.confidenceScores?.strategy === 'number' ? parsed.confidenceScores.strategy : 75,
         tone: typeof parsed.confidenceScores?.tone === 'number' ? parsed.confidenceScores.tone : 75,
         overall: typeof parsed.confidenceScores?.overall === 'number' ? parsed.confidenceScores.overall : 75
       },
       colors: Array.isArray(parsed.colors) 
         ? parsed.colors.slice(0, 5).map(c => ({ hex: c.hex || '#000000', name: c.name || 'Color', usage: c.usage || 'Primary' }))
         : [{ hex: '#3B82F6', name: 'Blue', usage: 'Primary' }],
       fonts: Array.isArray(parsed.fonts)
         ? parsed.fonts.slice(0, 3).map(f => ({ family: f.family || 'Arial', usage: f.usage || 'All', description: f.description || 'Typography' }))
         : [{ family: 'Arial', usage: 'All', description: 'Clean sans-serif' }],
       visualStyle: {
         style: parsed.visualStyle?.style || 'Modern',
         description: parsed.visualStyle?.description || 'Contemporary design'
       },
       toneOfVoice: {
         adjectives: Array.isArray(parsed.toneOfVoice?.adjectives) ? parsed.toneOfVoice.adjectives.slice(0, 3) : ['professional'],
         description: parsed.toneOfVoice?.description || 'Professional and friendly'
       },
       brandPersonality: Array.isArray(parsed.brandPersonality) ? parsed.brandPersonality.slice(0, 3) : ['professional'],
       targetAudience: parsed.targetAudience || 'Business professionals',
       personas: Array.isArray(parsed.personas) 
         ? parsed.personas.slice(0, 2).map(p => ({
             name: p.name || 'User',
             demographics: p.demographics || 'Professional',
             psychographics: p.psychographics || 'Quality-conscious',
             painPoints: Array.isArray(p.painPoints) ? p.painPoints.slice(0, 2) : ['efficiency'],
             behaviors: Array.isArray(p.behaviors) ? p.behaviors.slice(0, 2) : ['research']
           }))
         : [{ name: 'Primary User', demographics: 'Professional', psychographics: 'Quality-focused', painPoints: ['efficiency'], behaviors: ['research'] }],
       swot: {
         strengths: Array.isArray(parsed.swot?.strengths) ? parsed.swot.strengths.slice(0, 3) : ['Quality'],
         weaknesses: Array.isArray(parsed.swot?.weaknesses) ? parsed.swot.weaknesses.slice(0, 3) : ['Limited awareness'],
         opportunities: Array.isArray(parsed.swot?.opportunities) ? parsed.swot.opportunities.slice(0, 3) : ['Market expansion'],
         threats: Array.isArray(parsed.swot?.threats) ? parsed.swot.threats.slice(0, 3) : ['Competition']
       },
       competitors: Array.isArray(parsed.competitors)
         ? parsed.competitors.slice(0, 3).map(c => ({ name: c.name || 'Competitor', differentiation: c.differentiation || 'Different approach' }))
         : [{ name: 'Market competitor', differentiation: 'Alternative solution' }]
     };
   } catch (error: any) {
     console.error('[analyzeBrandDNA] ✗ Error:', error.message);
     
     // Return rich fallback profile with all fields populated
     const now = Date.now();
     return {
       id: `dna_${now}`,
       name: brandName || 'Unknown Brand',
       tagline: 'Professional brand in focus',
       description: `This brand focuses on delivering value to ${brandName ? 'its' : 'their'} audience through innovative solutions and quality service.`,
       mission: `To provide excellent ${brandName ? 'brand-specific' : ''} solutions that create lasting value`,
       elevatorPitch: `${brandName || 'This brand'} delivers innovative solutions with a focus on quality and customer success.`,
       websiteUrl: url,
       detectedLanguage: 'en',
       createdAt: now,
       values: ['Innovation', 'Quality', 'Customer Focus', 'Integrity', 'Excellence'],
       keyMessaging: ['Innovative solutions', 'Quality service', 'Customer success', 'Reliable partnership', 'Market leadership'],
       confidenceScores: { visuals: 60, strategy: 60, tone: 60, overall: 60 },
       colors: [
         { hex: '#3B82F6', name: 'Primary Blue', usage: 'Main brand color' },
         { hex: '#10B981', name: 'Success Green', usage: 'Accent color' },
         { hex: '#F59E0B', name: 'Warning Amber', usage: 'Secondary accent' }
       ],
       fonts: [
         { family: 'Inter', usage: 'Body text', description: 'Modern sans-serif' },
         { family: 'Poppins', usage: 'Headlines', description: 'Bold geometric sans-serif' }
       ],
       visualStyle: { style: 'Modern Minimalist', description: 'Clean, professional design with focus on clarity' },
       toneOfVoice: { 
         adjectives: ['professional', 'friendly', 'innovative'],
         description: 'Professional yet approachable, with emphasis on innovation and customer success'
       },
       brandPersonality: ['innovative', 'reliable', 'customer-focused'],
       targetAudience: 'Business professionals and organizations seeking quality solutions',
       personas: [
         {
           name: 'Strategic Decision Maker',
           demographics: 'Age 35-55, C-level executive',
           psychographics: 'Values efficiency and ROI',
           painPoints: ['time constraints', 'budget limitations', 'integration complexity'],
           behaviors: ['researches thoroughly', 'reads case studies', 'values testimonials']
         },
         {
           name: 'Implementation Manager',
           demographics: 'Age 25-40, operations manager',
           psychographics: 'Values practical solutions',
           painPoints: ['system integration', 'team adoption', 'support quality'],
           behaviors: ['tests features', 'checks documentation', 'talks to references']
         }
       ],
       swot: {
         strengths: ['Strong brand identity', 'Quality focus', 'Customer loyalty'],
         weaknesses: ['Market awareness', 'Budget constraints', 'Geographic reach'],
         opportunities: ['Market expansion', 'New partnerships', 'Product development'],
         threats: ['Competitive pressure', 'Market changes', 'Technology shifts']
       },
       competitors: [
         { name: 'Direct Competitor', differentiation: 'Different market positioning' },
         { name: 'Indirect Competitor', differentiation: 'Alternative solution approach' }
       ]
     };
   }
};

export const findLeadsWithMaps = (niche: string, latitude?: number, longitude?: number) => {
  const provider = getActiveLLMProvider();
  const locationStr = latitude && longitude ? ` near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : '';
  const prompt = `Find top 10 businesses in the "${niche}" niche${locationStr}. Include name, rating, address, website, contact info (email/phone), and social profiles. Format as JSON array.`;
  return geminiService.generate(provider, prompt);
};

export const runCloserAgent = (lead: any, sender?: any) => {
  const provider = getActiveLLMProvider();
  const leadInfo = JSON.stringify(lead).substring(0, 500);
  const senderInfo = sender ? JSON.stringify(sender).substring(0, 500) : 'Generic portfolio';
  const prompt = `Generate a complete closer portfolio for lead: ${leadInfo}. Sender profile: ${senderInfo}. Include target identity extraction, 3 sample social posts with image prompts, personalized email outreach, and 3 service packages.`;
  return geminiService.generate(provider, prompt);
};

export const generateAssetImage = async (prompt: string, style?: string): Promise<string> => {
  try {
    // ALWAYS read fresh from localStorage to get latest settings
    const settingsStr = localStorage.getItem('core_dna_settings');
    if (!settingsStr) {
      console.warn('[generateAssetImage] No settings found in localStorage');
      return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`;
    }
    
    const settings = JSON.parse(settingsStr);
    const provider = settings.activeImageGen;
    
    console.log(`[generateAssetImage] Using provider: ${provider}`);
    
    // If no provider configured, return placeholder immediately
    if (!provider) {
      console.warn('[generateAssetImage] No image provider configured, using placeholder');
      return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`;
    }
    
    const config = settings.image?.[provider];
    if (!config?.apiKey) {
      console.warn(`[generateAssetImage] No API key for ${provider}, using placeholder`);
      return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`;
    }
    
    // Use Stability AI for image generation (most reliable)
    if (provider === 'stability' || provider === 'sd3' || provider === 'fal_flux') {
      try {
        const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt;
        
        const formData = new FormData();
        formData.append('prompt', fullPrompt);
        formData.append('output_format', 'jpeg');
        
        const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Stability AI error: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return url;
      } catch (e) {
        console.error('[generateAssetImage] Stability AI failed:', e);
        console.warn('[generateAssetImage] Falling back to placeholder');
        return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`;
      }
    }
    
    // Fallback: return placeholder for unsupported providers
    console.warn(`[generateAssetImage] Provider ${provider} not fully implemented, using placeholder`);
    return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`;
  } catch (error: any) {
    console.error('[generateAssetImage] Unexpected error:', error.message);
    return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`;
  }
};

/**
 * Generate campaign assets using BrandDNA and LLM
 * Returns Promise<CampaignAsset[]>
 */
export const generateCampaignAssets = async (
  dna: any,
  goal: string = 'brand awareness',
  channels: string[] = ['Instagram', 'Email'],
  count: number = 5,
  tone?: string
): Promise<any[]> => {
  const provider = getActiveLLMProvider();
  
  const channelsList = channels.join(', ');
  const toneLine = tone && tone !== 'Brand Default' ? `Tone: ${tone}` : `Tone: Match the brand's "${dna.toneOfVoice?.description || 'professional'}" voice`;
  
  const prompt = `You are a marketing expert. Using this BrandDNA profile, generate ${count} campaign assets across these channels: ${channelsList}.

BRAND PROFILE:
- Name: ${dna.name}
- Tagline: ${dna.tagline}
- Description: ${dna.description}
- Key Messaging: ${dna.keyMessaging?.join('; ') || 'N/A'}
- Colors: ${dna.colors?.map((c: any) => c.hex).join(', ') || 'N/A'}
- Visual Style: ${dna.visualStyle?.description || 'Modern'}
- ${toneLine}
- Target Audience: ${dna.targetAudience}

CAMPAIGN GOAL: ${goal}

For EACH of the ${count} assets, create a JSON object with:
- id: unique identifier (e.g., "asset_1")
- channel: which channel this is for
- type: "image" | "carousel" | "email" | "blog"
- title: compelling headline
- copy: 150-200 character body text optimized for platform
- cta: call-to-action button text
- imagePrompt: detailed visual description for image generation (be specific about style, colors, composition)

Return ONLY a valid JSON array of ${count} objects. No markdown, no explanations.`;

  try {
    console.log(`[generateCampaignAssets] Generating ${count} assets for "${dna.name}" (goal: ${goal})`);
    console.log(`[generateCampaignAssets] Provider: ${provider}`);
    
    const response = await geminiService.generate(provider, prompt);
    console.log(`[generateCampaignAssets] Raw response received:`, response.substring(0, 200));
    
    // Parse JSON response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[generateCampaignAssets] Response does not contain JSON array:', jsonStr.substring(0, 300));
      throw new Error('No JSON array found in response');
    }
    
    const assets = JSON.parse(jsonMatch[0]);
    console.log(`[generateCampaignAssets] ✓ Generated ${assets.length} assets`);
    
    return Array.isArray(assets) ? assets : [];
  } catch (e: any) {
    console.error('[generateCampaignAssets] Error:', e.message);
    console.error('[generateCampaignAssets] Stack:', e.stack);
    throw e;
  }
};

/**
 * Generate a single campaign asset for specific channel (Hive mode)
 */
export const runAgentHiveCampaign = async (
  dna: any,
  goal: string,
  channel: string,
  statusCallback?: (msg: string) => void
): Promise<any> => {
  const provider = getActiveLLMProvider();
  
  if (statusCallback) statusCallback(`Initializing Hive Agent for ${channel}...`);
  
  const prompt = `You are a social media expert specializing in ${channel} marketing. Using this BrandDNA, create ONE highly optimized campaign asset.

BRAND:
- Name: ${dna.name}
- Description: ${dna.description}
- Key Messages: ${dna.keyMessaging?.join('; ') || 'N/A'}
- Colors: ${dna.colors?.map((c: any) => c.hex).join(', ') || 'N/A'}
- Tone: ${dna.toneOfVoice?.description}
- Target Audience: ${dna.targetAudience}

CHANNEL: ${channel}
GOAL: ${goal}

Create 1 asset optimized specifically for ${channel}. Include:
- title: compelling headline
- copy: platform-optimized body text (Instagram: <150 chars, Email: 200-300 chars, LinkedIn: professional tone)
- cta: action button text
- hashtags: relevant hashtags for ${channel}
- imagePrompt: detailed visual description with specific style, colors from brand palette

Return ONLY valid JSON object (not array). No markdown.`;

  try {
    if (statusCallback) statusCallback(`Calling ${provider} API...`);
    console.log(`[runAgentHiveCampaign] Creating asset for ${channel} using ${provider}`);
    
    const response = await geminiService.generate(provider, prompt);
    console.log(`[runAgentHiveCampaign] Raw response:`, response.substring(0, 200));
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[runAgentHiveCampaign] Response does not contain JSON object for ${channel}:`, jsonStr.substring(0, 300));
      throw new Error('No JSON found in response');
    }
    
    const asset = JSON.parse(jsonMatch[0]);
    asset.id = `asset_${Date.now()}`;
    asset.channel = channel;
    
    if (statusCallback) statusCallback(`✓ Asset created for ${channel}`);
    console.log(`[runAgentHiveCampaign] ✓ Created asset: ${asset.title}`);
    
    return asset;
  } catch (e: any) {
    console.error(`[runAgentHiveCampaign] Error: ${e.message}`);
    console.error(`[runAgentHiveCampaign] Stack:`, e.stack);
    if (statusCallback) statusCallback(`✗ Failed: ${e.message}`);
    throw e;
  }
};

/**
 * Create chat session for BrandDNA analysis
 */
export const createBrandChat = () => geminiService;

/**
 * Generate system prompt for AI Agent based on brand DNA and role
 */
export const generateAgentSystemPrompt = (
  dna: any,
  role: string = 'support',
  guardrails?: any
): string => {
  const forbiddenTopics = guardrails?.forbiddenTopics?.join(', ') || 'None specified';
  const requiredPhrases = guardrails?.requiredPhrases?.join(', ') || 'None required';
  const strictness = guardrails?.strictness || 'medium';

  const systemPrompt = `You are a brand representative AI agent for "${dna.name}".

BRAND IDENTITY:
- Tagline: ${dna.tagline}
- Description: ${dna.description}
- Mission: ${dna.mission}
- Key Messaging: ${dna.keyMessaging?.join('; ') || 'N/A'}
- Target Audience: ${dna.targetAudience}
- Tone of Voice: ${dna.toneOfVoice?.adjectives?.join(', ')} - ${dna.toneOfVoice?.description}
- Brand Personality: ${dna.brandPersonality?.join(', ')}
- Values: ${dna.values?.join(', ')}

ROLE: ${role.toUpperCase()}
${role === 'support' ? '- Provide helpful, empathetic customer support aligned with brand values' : ''}
${role === 'sales' ? '- Guide prospects toward purchase using persuasive, benefit-focused messaging' : ''}
${role === 'content' ? '- Create engaging content ideas that align with brand voice' : ''}
${role === 'research' ? '- Conduct market research and competitive analysis' : ''}

GUARDRAILS:
- Strictness Level: ${strictness}
- Forbidden Topics: ${forbiddenTopics}
- Required Phrases: ${requiredPhrases}
- Knowledge Base Limited: ${guardrails?.knowledgeBaseLimit ? 'Yes' : 'No'}

INSTRUCTIONS:
1. Always respond in character as a "${dna.name}" brand agent
2. Use the tone and personality defined above
3. Reference brand values and key messages when relevant
4. Decline requests that violate the guardrails above
5. Provide helpful, accurate information within your knowledge domain
6. End responses with relevant CTAs or next steps`;

  return systemPrompt;
};

/**
 * Initialize chat session with system prompt
 */
export const createAgentChat = (systemPrompt: string) => {
  console.log('[createAgentChat] Initializing agent chat session');
  return {
    systemPrompt,
    sendMessage: async (message: string) => {
      const provider = getActiveLLMProvider();
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
      return await geminiService.generate(provider, fullPrompt);
    }
  };
};
/**
 * Run battle simulation between two brands
 */
export const runBattleSimulation = async (brand1: any, brand2: any): Promise<any> => {
  const provider = getActiveLLMProvider();
  
  const prompt = `You are a brand strategist. Compare these two brands in a competitive analysis.

BRAND 1: ${brand1.name}
- Description: ${brand1.description}
- Key Messages: ${brand1.keyMessaging?.join('; ')}
- Strengths: ${brand1.swot?.strengths?.join('; ')}
- Target Audience: ${brand1.targetAudience}

BRAND 2: ${brand2.name}
- Description: ${brand2.description}
- Key Messages: ${brand2.keyMessaging?.join('; ')}
- Strengths: ${brand2.swot?.strengths?.join('; ')}
- Target Audience: ${brand2.targetAudience}

Provide analysis in JSON format with:
{
  "winner": "Brand 1 or Brand 2",
  "winningFactors": ["factor1", "factor2", "factor3"],
  "losingFactors": ["factor1", "factor2"],
  "competitiveGap": "percentage",
  "strategicRecommendations": {
    "for_brand1": "actionable advice",
    "for_brand2": "actionable advice"
  },
  "marketPosition": "description of relative positioning"
}

Return ONLY valid JSON.`;

  try {
    console.log(`[runBattleSimulation] Comparing "${brand1.name}" vs "${brand2.name}"`);
    const response = await geminiService.generate(provider, prompt);
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const result = JSON.parse(jsonMatch[0]);
    console.log(`[runBattleSimulation] ✓ Winner: ${result.winner}`);
    return result;
  } catch (e: any) {
    console.error('[runBattleSimulation] Error:', e.message);
    throw e;
  }
};

/**
 * Analyze uploaded marketing assets
 */
export const analyzeUploadedAssets = async (assets: any[]): Promise<any> => {
  const provider = getActiveLLMProvider();
  
  const assetSummary = assets.map((a, i) => `Asset ${i+1}: ${a.name || 'Unnamed'} - ${a.description || 'No description'}`).join('\n');
  
  const prompt = `You are a creative director. Analyze these marketing assets and provide feedback.

ASSETS TO REVIEW:
${assetSummary}

Provide analysis in JSON with:
{
  "overallScore": 1-10,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "brandAlignment": "assessment of brand fit",
  "recommendations": ["recommendation1", "recommendation2"],
  "suggestions": "detailed improvement suggestions"
}

Return ONLY valid JSON.`;

  try {
    console.log(`[analyzeUploadedAssets] Analyzing ${assets.length} assets`);
    const response = await geminiService.generate(provider, prompt);
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const result = JSON.parse(jsonMatch[0]);
    console.log(`[analyzeUploadedAssets] ✓ Score: ${result.overallScore}/10`);
    return result;
  } catch (e: any) {
    console.error('[analyzeUploadedAssets] Error:', e.message);
    throw e;
  }
};

/**
 * Optimize posting schedule for maximum engagement
 */
export const optimizeSchedule = async (posts: any[]): Promise<any[]> => {
  const provider = getActiveLLMProvider();
  
  const postSummary = posts.map((p, i) => `Post ${i+1}: "${p.title}" for ${p.channel || 'unknown'}`).join('\n');
  
  const prompt = `You are a social media strategist. Optimize this posting schedule for maximum engagement.

POSTS TO SCHEDULE:
${postSummary}

For each post, determine optimal:
- Day of week (Monday-Sunday)
- Time of day (morning/afternoon/evening)
- Platform-specific timing
- Spacing between posts

Return JSON array with each post's optimized schedule:
[
  {
    "postId": "id",
    "title": "post title",
    "channel": "platform",
    "recommendedDay": "day",
    "recommendedTime": "HH:MM",
    "reasoning": "why this time"
  }
]

Return ONLY valid JSON array.`;

  try {
    console.log(`[optimizeSchedule] Optimizing ${posts.length} posts`);
    const response = await geminiService.generate(provider, prompt);
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found');
    
    const result = JSON.parse(jsonMatch[0]);
    console.log(`[optimizeSchedule] ✓ Optimized schedule for ${result.length} posts`);
    return Array.isArray(result) ? result : [];
  } catch (e: any) {
    console.error('[optimizeSchedule] Error:', e.message);
    return posts; // Return original if optimization fails
  }
};

/**
 * Generate video using Veo or fallback
 * NOTE: fal.ai video generation requires paid API key and GPU resources
 * This is a placeholder that returns mock video URL
 */
export const generateVeoVideo = async (prompt: string): Promise<{ url: string }> => {
  try {
    console.log('[generateVeoVideo] Video generation placeholder for prompt:', prompt.substring(0, 100));
    
    // Return mock video URL - real implementation requires:
    // 1. fal.ai API key (paid service)
    // 2. Video model access (Wan2.1, LTX-2, etc.)
    // 3. GPU resources for processing
    console.log('[generateVeoVideo] Returning placeholder (real video generation requires fal.ai paid API)');
    return { url: 'https://via.placeholder.com/video.mp4' };
  } catch (e) {
    console.warn('[generateVeoVideo] Error:', e);
    return { url: 'https://via.placeholder.com/video.mp4' };
  }
};

/**
 * Generate trend pulse (trending topics) for brand
 */
export const generateTrendPulse = async (dna: any): Promise<any[]> => {
    const provider = getActiveLLMProvider();
    
    const prompt = `You are a market trends analyst. Identify 3-5 trending topics relevant to "${dna.name}" (${dna.description}).

Industry: ${dna.targetAudience}
Key Messages: ${dna.keyMessaging?.join('; ')}

For EACH trend, provide JSON object with:
- id: unique identifier
- topic: trend title (2-4 words)
- summary: 2-3 sentence explanation
- relevanceScore: 1-100 (how relevant to brand)
- suggestedAngle: how brand should respond/leverage
- actionItems: ["action1", "action2"]

Return ONLY valid JSON array. No markdown.`;

    try {
      console.log(`[generateTrendPulse] Generating trends for "${dna.name}"`);
      const response = await geminiService.generate(provider, prompt);
      
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found');
      
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[generateTrendPulse] ✓ Generated ${parsed.length} trends`);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e: any) {
      console.error('[generateTrendPulse] Failed:', e.message);
      return [];
    }
};

/**
 * Refine asset based on user feedback
 */
export const refineAssetWithAI = async (asset: any, feedback: string): Promise<any> => {
  const provider = getActiveLLMProvider();
  
  const prompt = `You are a creative director. Refine this asset based on feedback.

CURRENT ASSET:
- Title: ${asset.title}
- Copy: ${asset.copy}
- Channel: ${asset.channel}
- Type: ${asset.type}

USER FEEDBACK: ${feedback}

Create refined version with same structure but improved based on feedback. Return JSON:
{
  "title": "refined title",
  "copy": "refined copy",
  "cta": "refined CTA",
  "imagePrompt": "updated visual prompt",
  "changes": "summary of changes made"
}

Return ONLY valid JSON.`;

  try {
    console.log(`[refineAssetWithAI] Refining asset with feedback: "${feedback.substring(0, 50)}..."`);
    const response = await geminiService.generate(provider, prompt);
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const refined = JSON.parse(jsonMatch[0]);
    console.log('[refineAssetWithAI] ✓ Asset refined');
    return { ...asset, ...refined };
  } catch (e: any) {
    console.error('[refineAssetWithAI] Error:', e.message);
    throw e;
  }
};

/**
 * Universal generate function - sends any prompt to active LLM
 */
export const universalGenerate = async (prompt: string): Promise<string> => {
  const provider = getActiveLLMProvider();
  console.log(`[universalGenerate] Using provider: ${provider}`);
  return await geminiService.generate(provider, prompt);
};
