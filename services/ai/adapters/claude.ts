import { getApiKey } from '../settingsService';

export async function callClaude(prompt: string, model = 'claude-3-5-sonnet-20241022'): Promise<string> {
  const apiKey = getApiKey('llms', 'anthropic');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}
