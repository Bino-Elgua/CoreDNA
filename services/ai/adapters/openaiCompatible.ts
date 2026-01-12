import { getApiKey } from '../settingsService';

const endpoints: Record<string, string> = {
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  xai: 'https://api.x.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions'
};

const defaultModels: Record<string, string> = {
  mistral: 'mistral-large-latest',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
  xai: 'grok-beta',
  openrouter: 'anthropic/claude-3.5-sonnet',
  together: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  perplexity: 'llama-3.1-sonar-large-128k-online'
};

export async function callOpenAICompatible(provider: string, prompt: string, model?: string): Promise<string> {
  const apiKey = getApiKey('llms', provider);
  const endpoint = endpoints[provider];
  const finalModel = model || defaultModels[provider];
  
  if (!endpoint) {
    throw new Error(`Unknown OpenAI-compatible provider: ${provider}`);
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(provider === 'openrouter' && {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CoreDNA2'
      })
    },
    body: JSON.stringify({
      model: finalModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${provider} API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
