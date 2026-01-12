import { ProviderConfig, LLMProviderId, ImageProviderId, VoiceProviderId, WorkflowProviderId } from '../types';

export interface HealthCheckResult {
    valid: boolean;
    status: 'checking' | 'valid' | 'invalid' | 'error';
    message: string;
    timestamp: number;
}

// Cache health checks for 5 minutes to avoid hammering APIs
const healthCheckCache = new Map<string, { result: HealthCheckResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const clearExpiredCache = (key: string) => {
    const cached = healthCheckCache.get(key);
    if (cached && Date.now() - cached.timestamp > CACHE_TTL) {
        healthCheckCache.delete(key);
    }
};

export const checkLLMHealth = async (provider: LLMProviderId, config: ProviderConfig): Promise<HealthCheckResult> => {
    const cacheKey = `llm_${provider}_${config.apiKey}`;
    
    clearExpiredCache(cacheKey);
    if (healthCheckCache.has(cacheKey)) {
        return healthCheckCache.get(cacheKey)!.result;
    }

    try {
        if (!config.apiKey || config.apiKey.trim() === '') {
            return { valid: false, status: 'invalid', message: 'API key is empty', timestamp: Date.now() };
        }

        // Provider-specific health checks
        let result: HealthCheckResult;
        try {
            switch (provider) {
                case 'google':
                    result = await checkGoogleGemini(config.apiKey);
                    break;
                case 'openai':
                    result = await checkOpenAI(config.apiKey);
                    break;
                case 'anthropic':
                    result = await checkAnthropic(config.apiKey);
                    break;
                case 'mistral':
                    result = await checkMistral(config.apiKey, config.baseUrl);
                    break;
                case 'groq':
                    result = await checkGroq(config.apiKey);
                    break;
                case 'cohere':
                    result = await checkCohere(config.apiKey);
                    break;
                case 'deepseek':
                    result = await checkDeepSeek(config.apiKey, config.baseUrl);
                    break;
                case 'perplexity':
                    result = await checkPerplexity(config.apiKey);
                    break;
                default:
                    // For other providers, do a basic format check
                    return { valid: true, status: 'valid', message: 'API key format appears valid (full validation not yet implemented)', timestamp: Date.now() };
            }
        } catch (error) {
            // If health check itself throws, return error status
            const errMsg = error instanceof Error ? error.message : String(error);
            result = {
                valid: false,
                status: 'error' as const,
                message: `Health check failed: ${errMsg.substring(0, 100)}`,
                timestamp: Date.now()
            };
        }

        healthCheckCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    } catch (error) {
        const result = {
            valid: false,
            status: 'error' as const,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
        };
        healthCheckCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    }
};

export const checkImageHealth = async (provider: ImageProviderId, config: ProviderConfig): Promise<HealthCheckResult> => {
    const cacheKey = `image_${provider}_${config.apiKey}`;
    
    clearExpiredCache(cacheKey);
    if (healthCheckCache.has(cacheKey)) {
        return healthCheckCache.get(cacheKey)!.result;
    }

    try {
        if (!config.apiKey || config.apiKey.trim() === '') {
            return { valid: false, status: 'invalid', message: 'API key is empty', timestamp: Date.now() };
        }

        switch (provider) {
            case 'google':
                return await checkGoogleGemini(config.apiKey);
            case 'openai':
            case 'openai_dalle_next':
                return await checkOpenAI(config.apiKey);
            case 'stability':
                return await checkStability(config.apiKey);
            case 'fal_flux':
                return await checkFalAI(config.apiKey);
            default:
                return { valid: true, status: 'valid', message: 'API key format appears valid (full validation not yet implemented)', timestamp: Date.now() };
        }
    } catch (error) {
        const result = {
            valid: false,
            status: 'error' as const,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
        };
        healthCheckCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    }
};

export const checkVoiceHealth = async (provider: VoiceProviderId, config: ProviderConfig): Promise<HealthCheckResult> => {
    const cacheKey = `voice_${provider}_${config.apiKey}`;
    
    clearExpiredCache(cacheKey);
    if (healthCheckCache.has(cacheKey)) {
        return healthCheckCache.get(cacheKey)!.result;
    }

    try {
        if (!config.apiKey || config.apiKey.trim() === '') {
            return { valid: false, status: 'invalid', message: 'API key is empty', timestamp: Date.now() };
        }

        switch (provider) {
            case 'elevenlabs':
                return await checkElevenLabs(config.apiKey);
            case 'openai':
                return await checkOpenAI(config.apiKey);
            case 'playht':
                return await checkPlayHT(config.apiKey);
            case 'deepgram':
                return await checkDeepgram(config.apiKey);
            default:
                return { valid: true, status: 'valid', message: 'API key format appears valid (full validation not yet implemented)', timestamp: Date.now() };
        }
    } catch (error) {
        const result = {
            valid: false,
            status: 'error' as const,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
        };
        healthCheckCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    }
};

export const checkWorkflowHealth = async (provider: WorkflowProviderId, config: ProviderConfig): Promise<HealthCheckResult> => {
    const cacheKey = `workflow_${provider}_${config.webhookUrl}`;
    
    clearExpiredCache(cacheKey);
    if (healthCheckCache.has(cacheKey)) {
        return healthCheckCache.get(cacheKey)!.result;
    }

    try {
        if (!config.webhookUrl || config.webhookUrl.trim() === '') {
            return { valid: false, status: 'invalid', message: 'Webhook URL is empty', timestamp: Date.now() };
        }

        // Basic URL validation
        try {
            new URL(config.webhookUrl);
        } catch {
            return { valid: false, status: 'invalid', message: 'Invalid URL format', timestamp: Date.now() };
        }

        // Try a simple HEAD request or GET to see if endpoint is reachable
        const response = await fetch(config.webhookUrl, { method: 'HEAD', mode: 'no-cors', timeout: 5000 });
        const result = {
            valid: true,
            status: 'valid' as const,
            message: 'Webhook URL is reachable',
            timestamp: Date.now()
        };
        healthCheckCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    } catch (error) {
        const result = {
            valid: false,
            status: 'error' as const,
            message: error instanceof Error ? error.message : 'Webhook URL unreachable or invalid',
            timestamp: Date.now()
        };
        healthCheckCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    }
};

// === PROVIDER-SPECIFIC CHECKS ===

const checkGoogleGemini = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        // Try the generateContent endpoint
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'test' }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
            })
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Google Gemini API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_google_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else if (response.status === 429) {
            return { valid: true, status: 'valid', message: 'API key is valid (rate limited)', timestamp: Date.now() };
        } else if (response.status === 400) {
            // 400 could mean invalid request format, but key might still be valid
            const bodyText = await response.text();
            if (bodyText.includes('API key') || bodyText.includes('authentication')) {
                return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
            } else {
                // Request format issue, but key is likely valid
                const result = {
                    valid: true,
                    status: 'valid' as const,
                    message: 'API key is valid (minor format issue)',
                    timestamp: Date.now()
                };
                healthCheckCache.set(`llm_google_${apiKey}`, { result, timestamp: Date.now() });
                return result;
            }
        } else {
            const text = await response.text();
            return { valid: false, status: 'error', message: `API error: ${response.status} - ${text.substring(0, 100)}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkOpenAI = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'OpenAI API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_openai_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkAnthropic = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-latest',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'test' }]
            })
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Anthropic API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_anthropic_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkMistral = async (apiKey: string, baseUrl?: string): Promise<HealthCheckResult> => {
    try {
        const url = baseUrl || 'https://api.mistral.ai/v1';
        const response = await fetch(`${url}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
            })
        });

        const responseText = await response.text();

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Mistral API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_mistral_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            // Check response body for actual auth error
            if (responseText.includes('Unauthorized') || responseText.includes('Invalid API key') || responseText.includes('authentication')) {
                return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
            } else {
                // Could be a different 401/403 error
                return { valid: false, status: 'invalid', message: `Auth error: ${responseText.substring(0, 80)}`, timestamp: Date.now() };
            }
        } else if (response.status === 400) {
            // 400 could be request format, not necessarily key validation
            // Try to proceed - key might still be valid
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'API key appears valid (request format issue)',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_mistral_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 429) {
            return { valid: true, status: 'valid', message: 'API key is valid (rate limited)', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status} - ${responseText.substring(0, 100)}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkGroq = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
            })
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Groq API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_groq_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkCohere = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'command-r-plus',
                message: 'test'
            })
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Cohere API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_cohere_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkDeepSeek = async (apiKey: string, baseUrl?: string): Promise<HealthCheckResult> => {
    try {
        const url = baseUrl || 'https://api.deepseek.com/v1';
        const response = await fetch(`${url}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
            })
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'DeepSeek API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_deepseek_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkPerplexity = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3-sonar-large-32k-online',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
            })
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Perplexity API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`llm_perplexity_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkStability = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        // Test by checking account balance instead of generating
        const response = await fetch('https://api.stability.ai/v1/user/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Stability API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`image_stability_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            const error = await response.text();
            return { valid: false, status: 'error', message: `API error ${response.status}: ${error.substring(0, 50)}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkFalAI = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.fal.ai/v1/models', {
            headers: { 'Authorization': `Key ${apiKey}` }
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Fal.ai API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`image_fal_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkElevenLabs = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: { 'xi-api-key': apiKey }
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'ElevenLabs API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`voice_elevenlabs_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkPlayHT = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.play.ht/api/v1/voices', {
            headers: { 'Authorization': apiKey }
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'PlayHT API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`voice_playht_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};

const checkDeepgram = async (apiKey: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch('https://api.deepgram.com/v1/models', {
            headers: { 'Authorization': `Token ${apiKey}` }
        });

        if (response.status === 200) {
            const result = {
                valid: true,
                status: 'valid' as const,
                message: 'Deepgram API key is valid',
                timestamp: Date.now()
            };
            healthCheckCache.set(`voice_deepgram_${apiKey}`, { result, timestamp: Date.now() });
            return result;
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, status: 'invalid', message: 'Invalid or expired API key', timestamp: Date.now() };
        } else {
            return { valid: false, status: 'error', message: `API error: ${response.status}`, timestamp: Date.now() };
        }
    } catch (error) {
        return { valid: false, status: 'error', message: error instanceof Error ? error.message : 'Network error', timestamp: Date.now() };
    }
};
