/**
 * Text Generation Router
 * Routes text generation requests to the appropriate LLM provider
 */

import { getActiveProvider } from './settingsService';
import { callGemini } from './adapters/gemini';
import { callOpenAI } from './adapters/openai';
import { callClaude } from './adapters/claude';
import { callOpenAICompatible } from './adapters/openaiCompatible';
import { callQwen, callCohere } from './adapters/other';

const openAICompatibleProviders = ['mistral', 'groq', 'deepseek', 'xai', 'openrouter', 'together', 'perplexity'];

/**
 * Generate text using the active or specified LLM provider
 * @param prompt - The prompt to send to the LLM
 * @param provider - Optional provider override (uses activeLLM from settings if not provided)
 * @param model - Optional model override
 * @returns Plain text response from the LLM
 * @throws Error if provider not configured or API call fails
 */
export async function generateText(
  prompt: string,
  provider?: string,
  model?: string
): Promise<string> {
  try {
    const activeProvider = provider || getActiveProvider('llms');
    
    console.log(`[generateText] Using provider: ${activeProvider}`);
    
    switch (activeProvider) {
      case 'gemini':
      case 'google':
        return await callGemini(prompt, model);
      
      case 'openai':
        return await callOpenAI(prompt, model);
      
      case 'anthropic':
      case 'claude':
        return await callClaude(prompt, model);
      
      case 'mistral':
      case 'groq':
      case 'deepseek':
      case 'xai':
      case 'openrouter':
      case 'together':
      case 'perplexity':
        return await callOpenAICompatible(activeProvider, prompt, model);
      
      case 'qwen':
        return await callQwen(prompt, model);
      
      case 'cohere':
        return await callCohere(prompt, model);
      
      default:
        throw new Error(`LLM provider "${activeProvider}" not supported`);
    }
  } catch (error: any) {
    console.error('[generateText] Error:', error.message);
    throw error;
  }
}

/**
 * Check if a text provider is available
 */
export function hasTextProvider(provider: string): boolean {
  try {
    const active = getActiveProvider('llms');
    return true;
  } catch {
    return false;
  }
}
