/**
 * Video Generation Router
 * Routes video generation requests to the appropriate video provider
 */

import { getActiveProvider, getApiKey } from './settingsService';

interface VideoGenerationOptions {
  duration?: number;
  fps?: number;
  resolution?: string;
}

interface VideoGenerationResult {
  url: string;
  provider: string;
}

/**
 * Generate video using the active or specified video provider
 * @param prompt - The scene/video description
 * @param options - Generation options (duration, resolution, etc.)
 * @returns Video URL or null if no provider configured
 * @throws Error if provider misconfigured or API call fails
 */
export async function generateVideo(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult | null> {
  try {
    const provider = getActiveProvider('video');
    
    console.log(`[generateVideo] Using provider: ${provider}`);
    
    switch (provider) {
      case 'runway':
        return await generateRunway(prompt, options);
      
      case 'luma':
        return await generateLuma(prompt, options);
      
      case 'pika':
        return await generatePika(prompt, options);
      
      case 'kling':
        return await generateKling(prompt, options);
      
      default:
        throw new Error(`Video provider "${provider}" not supported`);
    }
  } catch (error: any) {
    console.error('[generateVideo] Error:', error.message);
    // Video generation is optional—return null instead of throwing
    return null;
  }
}

async function generateRunway(prompt: string, options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const apiKey = getApiKey('video', 'runway');
  
  const response = await fetch('https://api.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      duration: options.duration || 5,
      fps: options.fps || 30,
      motion: 5
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Runway error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.video?.url || data.output?.video || data.url,
    provider: 'runway'
  };
}

async function generateLuma(prompt: string, options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const apiKey = getApiKey('video', 'luma');
  
  const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '16:9'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Luma error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.video?.url || data.asset?.video_url || data.url,
    provider: 'luma'
  };
}

async function generatePika(prompt: string, options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const apiKey = getApiKey('video', 'pika');
  
  const response = await fetch('https://api.pika.art/v1/pipelines/anime-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      duration: options.duration || 4
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Pika error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.output?.[0]?.url || data.video?.url,
    provider: 'pika'
  };
}

async function generateKling(prompt: string, options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const apiKey = getApiKey('video', 'kling');
  
  const response = await fetch('https://api.kuaishou.com/open/video/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      duration: options.duration || 6,
      mode: 'std'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Kling error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.data?.videos?.[0]?.url || data.output?.video,
    provider: 'kling'
  };
}
