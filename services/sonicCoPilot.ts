// Sonic Co-Pilot Service
// Full LLM agent with app execution capabilities

import { geminiService } from './geminiService';

const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey?.trim()) {
    return settings.activeLLM;
  }
  
  if (settings.llms && Object.keys(settings.llms).length > 0) {
    for (const key of Object.keys(settings.llms)) {
      if (key !== 'google' && key !== 'gemini') {
        const llmConfig = settings.llms[key] as any;
        if (llmConfig?.apiKey?.trim()) {
          return key;
        }
      }
    }
    
    for (const [key, config] of Object.entries(settings.llms)) {
      const llmConfig = config as any;
      if (llmConfig?.apiKey?.trim()) {
        return key;
      }
    }
  }
  
  throw new Error('No LLM provider configured. Go to Settings → API Keys.');
};

export interface SonicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SonicAction {
  type: 'navigate' | 'show_toast' | 'fetch' | 'none';
  target?: string;
  message?: string;
  url?: string;
}

/**
 * Main Sonic Co-Pilot chat function
 * Uses LLM with context about the app to generate responses and determine actions
 */
export async function sonicChat(
  userMessage: string,
  conversationHistory: SonicMessage[] = [],
  userTier: string = 'free',
  brandName?: string
): Promise<{ response: string; action?: SonicAction }> {
  try {
    const provider = getActiveLLMProvider();
    
    const systemPrompt = `You are Sonic Co-Pilot, an AI assistant for CoreDNA - a brand design and marketing automation tool. You help users navigate the app, explain features, and execute tasks.

USER TIER: ${userTier}
${brandName ? `CURRENT BRAND: ${brandName}` : ''}

Available Features by Tier:
- Free: Dashboard, Extract DNA, Battle Mode, Sonic Lab
- Pro: All Free + Campaigns, Scheduler
- Hunter: All Pro + Lead Hunter, Automations
- Agency: All features + Affiliate Hub, White-label

You can help users with:
1. Navigating to pages (e.g., "Take me to campaigns")
2. Explaining features and tier requirements
3. Providing usage tips and best practices
4. Asking clarifying questions about what they want to do

When users ask to navigate somewhere, respond naturally and include a JSON action block at the end:
[ACTION]{"type":"navigate","target":"/campaigns"}[/ACTION]

For example:
- "go to campaigns" → [ACTION]{"type":"navigate","target":"/campaigns"}[/ACTION]
- "show me the scheduler" → [ACTION]{"type":"navigate","target":"/scheduler"}[/ACTION]
- "open settings" → [ACTION]{"type":"navigate","target":"/settings"}[/ACTION]
- "I want to extract a brand" → [ACTION]{"type":"navigate","target":"/extract"}[/ACTION]

Valid routes: /dashboard, /extract, /battle, /sonic, /campaigns, /scheduler, /builder, /agent-forge, /automations, /affiliate, /settings

Be conversational, helpful, and acknowledge tier limitations when relevant.`;

    // Build conversation for context
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];

    // Create prompt with conversation history
    let prompt = systemPrompt + '\n\nConversation:\n';
    messages.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    prompt += '\nAssistant:';

    const response = await geminiService.generate(provider, prompt);
    
    // Parse action from response if present
    let action: SonicAction | undefined;
    let cleanResponse = response;

    const actionMatch = response.match(/\[ACTION\](.*?)\[\/ACTION\]/s);
    if (actionMatch) {
      try {
        const actionJson = JSON.parse(actionMatch[1]);
        action = actionJson;
        cleanResponse = response.replace(/\[ACTION\].*?\[\/ACTION\]/s, '').trim();
      } catch (e) {
        console.warn('Failed to parse action:', actionMatch[1]);
      }
    }

    return { response: cleanResponse, action };
  } catch (error: any) {
    console.error('[Sonic] Error:', error.message);
    return {
      response: `I encountered an error: ${error.message}. Make sure you have an LLM provider configured in Settings → API Keys.`,
      action: undefined
    };
  }
}

/**
 * Legacy function for backwards compatibility
 */
export async function sonicExecuteCommand(
  input: string,
  userTier: string
): Promise<string> {
  const result = await sonicChat(input, [], userTier);
  return result.response;
}

function extractDomain(input: string): string | null {
  const match = input.match(/(?:extract\s+)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  return match ? match[1] : null;
}

function extractWorkflowName(input: string): string | null {
  const match = input.match(/workflow\s+([a-zA-Z0-9-]+)/i);
  return match ? match[1] : null;
}

export async function logSonicAction(
  userId: string,
  action: string,
  command: string,
  result: string
): Promise<void> {
  // Log to Supabase or local storage
  console.log(`[Sonic] ${userId}: ${action} - ${command} -> ${result}`);
}
