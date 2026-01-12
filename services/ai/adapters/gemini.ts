import { getApiKey } from '../settingsService';

export async function callGemini(prompt: string, model = 'gemini-2.0-flash'): Promise<string> {
  const apiKey = getApiKey('llms', 'gemini');
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    const message = error.error?.message || response.statusText;
    throw new Error(`Gemini API error: ${message}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
