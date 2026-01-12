/**
 * Settings Service - API Key Retrieval
 * Abstracts accessing API keys from localStorage by category
 */

export type KeyCategory = 'llms' | 'image' | 'video' | 'voice' | 'workflows';

export interface ApiKeyConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  endpoint?: string;
}

/**
 * Get API key for a provider in a specific category
 * @throws Error if provider not configured or no API key
 */
export function getApiKey(category: KeyCategory, provider: string): string {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  const config = settings[category]?.[provider];
  if (!config?.apiKey?.trim?.()) {
    throw new Error(`No API key for ${provider} in ${category}. Go to Settings → API Keys to add one.`);
  }
  
  return config.apiKey.trim();
}

/**
 * Get full config for a provider
 */
export function getProviderConfig(category: KeyCategory, provider: string): ApiKeyConfig {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  const config = settings[category]?.[provider];
  if (!config?.apiKey?.trim?.()) {
    throw new Error(`No API key for ${provider} in ${category}. Go to Settings → API Keys to add one.`);
  }
  
  return {
    apiKey: config.apiKey.trim(),
    baseUrl: config.baseUrl,
    model: config.defaultModel,
    endpoint: config.endpoint
  };
}

/**
 * Get active provider for a category, or first available one
 */
export function getActiveProvider(category: KeyCategory): string {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  const activeKey = category === 'llms' ? 'activeLLM' : 
                    category === 'image' ? 'activeImageGen' :
                    category === 'video' ? 'activeVideo' :
                    category === 'voice' ? 'activeVoice' : 'activeWorkflow';
  
  // Try configured active provider first
  if (settings[activeKey] && settings[category]?.[settings[activeKey]]?.apiKey?.trim?.()) {
    return settings[activeKey];
  }
  
  // Fall back to first available provider with API key
  if (settings[category]) {
    for (const [provider, config]: [string, any] of Object.entries(settings[category])) {
      if (config.apiKey?.trim?.()) {
        console.log(`[getActiveProvider] No active ${category} provider, using ${provider}`);
        return provider;
      }
    }
  }
  
  throw new Error(`No ${category} provider configured in Settings → API Keys`);
}

/**
 * Check if a provider is configured with API key
 */
export function hasProvider(category: KeyCategory, provider: string): boolean {
  try {
    getApiKey(category, provider);
    return true;
  } catch {
    return false;
  }
}
