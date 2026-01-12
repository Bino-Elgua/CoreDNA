/**
 * Image Generation Router
 * Routes image generation requests to the appropriate image provider
 */

import { getActiveProvider, getApiKey } from './settingsService';

interface ImageGenerationOptions {
  size?: string;
  style?: string;
  quality?: number;
  negativePrompt?: string;
}

interface ImageGenerationResult {
  url: string;
  provider: string;
}

/**
 * Generate image using the active or specified image provider
 * @param prompt - The visual description/prompt
 * @param options - Generation options (size, style, etc.)
 * @returns Image URL
 * @throws Error if provider not configured or API call fails
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  try {
    const provider = getActiveProvider('image');
    const fullPrompt = options.style ? `${prompt}. Style: ${options.style}` : prompt;
    
    console.log(`[generateImage] Using provider: ${provider}`);
    
    switch (provider) {
      case 'dalle':
      case 'openai_dalle_next':
        return await generateDALLE(fullPrompt, options);
      
      case 'ideogram':
        return await generateIdeogram(fullPrompt, options);
      
      case 'fal_flux':
      case 'black_forest_labs':
        return await generateFlux(fullPrompt, options);
      
      case 'midjourney':
        return await generateMidjourney(fullPrompt, options);
      
      case 'stability':
      case 'sd3':
        return await generateStabilityAI(fullPrompt, options);
      
      default:
        throw new Error(`Image provider "${provider}" not supported`);
    }
  } catch (error: any) {
    console.error('[generateImage] Error:', error.message);
    throw error;
  }
}

async function generateDALLE(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const apiKey = getApiKey('image', 'dalle');
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: 'hd'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.data[0].url,
    provider: 'dalle'
  };
}

async function generateIdeogram(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const apiKey = getApiKey('image', 'ideogram');
  
  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        aspect_ratio: 'ASPECT_1_1',
        model: 'V_2_TURBO',
        magic_prompt_option: 'AUTO'
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Ideogram error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.data?.[0]?.url || data.image_url,
    provider: 'ideogram'
  };
}

async function generateFlux(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const apiKey = getApiKey('image', 'fal_flux');
  
  const response = await fetch('https://fal.run/fal-ai/flux-pro', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      image_size: options.size || 'landscape_4_3',
      num_inference_steps: 28,
      guidance_scale: 7.5
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Flux error: ${error.detail || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.image?.url || data.output?.url || data.url,
    provider: 'flux'
  };
}

async function generateMidjourney(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const apiKey = getApiKey('image', 'midjourney');
  
  // Midjourney uses external API wrapper
  const response = await fetch('https://api.midjourney.com/v1/imagine', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Midjourney error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.imageUrl || data.output_url,
    provider: 'midjourney'
  };
}

async function generateStabilityAI(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const apiKey = getApiKey('image', 'stability');
  
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'jpeg');
  
  if (options.negativePrompt) {
    formData.append('negative_prompt', options.negativePrompt);
  }
  
  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stability AI error: ${response.status} - ${error}`);
  }
  
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    provider: 'stability'
  };
}
