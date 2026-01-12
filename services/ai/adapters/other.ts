import { getApiKey } from '../settingsService';

export async function callQwen(prompt: string, model = 'qwen-turbo'): Promise<string> {
  const apiKey = getApiKey('llms', 'qwen');
  
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: { messages: [{ role: 'user', content: prompt }] },
      parameters: { temperature: 0.7, max_tokens: 2048 }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Qwen API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.output.text;
}

export async function callCohere(prompt: string, model = 'command-r-plus'): Promise<string> {
  const apiKey = getApiKey('llms', 'cohere');
  
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      max_tokens: 2048,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cohere API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.generations[0].text;
}
