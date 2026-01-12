/**
 * Media Generation Service
 * Unified image and video generation with support for multiple providers
 * Converts stubbed media calls into real API requests with intelligent fallback
 */

interface MediaGenerationResult {
  url: string;
  provider: string;
  generatedAt: number;
  metadata?: Record<string, any>;
}

interface ImageGenerationOptions {
  style?: string;
  size?: string;
  quality?: number;
  negativePrompt?: string;
  seed?: number;
}

interface VideoGenerationOptions {
  duration?: number;
  fps?: number;
  resolution?: string;
  format?: string;
  seed?: number;
}

/**
 * Get active image provider from settings
 */
function getActiveImageProvider(): { provider: string; apiKey: string } {
  try {
    const settingsStr = localStorage.getItem('core_dna_settings');
    if (!settingsStr) {
      console.error('[getActiveImageProvider] No settings found in localStorage');
      throw new Error('Settings not found in localStorage');
    }
    
    const settings = JSON.parse(settingsStr);
    console.log('[getActiveImageProvider] Settings loaded. activeImageGen:', settings.activeImageGen);
    console.log('[getActiveImageProvider] Available image providers:', settings.image ? Object.keys(settings.image) : 'none');
    
    // Check activeImageGen first
    if (settings.activeImageGen && settings.image?.[settings.activeImageGen]?.apiKey?.trim()) {
      const apiKey = settings.image[settings.activeImageGen].apiKey.trim();
      console.log(`[getActiveImageProvider] ✓ Using configured activeImageGen: ${settings.activeImageGen}`);
      return {
        provider: settings.activeImageGen,
        apiKey
      };
    }
    
    console.log('[getActiveImageProvider] activeImageGen not configured, searching for available providers');
    
    // Fall back to first available image provider
    if (settings.image) {
      for (const [key, config]: [string, any] of Object.entries(settings.image)) {
        const apiKey = (config as any).apiKey?.trim?.();
        if (apiKey) {
          console.log(`[getActiveImageProvider] ✓ Found available provider: ${key}`);
          return { provider: key, apiKey };
        }
      }
    }
    
    console.error('[getActiveImageProvider] No image providers configured');
    throw new Error('No image generation provider configured. Go to Settings → API Keys to add one.');
  } catch (error: any) {
    console.error('[getActiveImageProvider] Error:', error.message);
    throw error;
  }
}

/**
 * Get active video provider from settings
 */
function getActiveVideoProvider(): { provider: string; apiKey: string } | null {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  // Check activeVideo first
  if (settings.activeVideo && settings.video?.[settings.activeVideo]?.apiKey?.trim()) {
    return {
      provider: settings.activeVideo,
      apiKey: settings.video[settings.activeVideo].apiKey.trim()
    };
  }
  
  // Fall back to first available video provider
  if (settings.video) {
    for (const [key, config]: any of Object.entries(settings.video)) {
      if (config.apiKey?.trim()) {
        return { provider: key, apiKey: config.apiKey.trim() };
      }
    }
  }
  
  console.warn('[getActiveVideoProvider] No video provider configured');
  return null;
}

/**
 * Generate image using real providers
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<MediaGenerationResult> {
  try {
    console.log('[generateImage] Starting image generation for:', prompt.substring(0, 50));
    
    let providerInfo: { provider: string; apiKey: string };
    try {
      providerInfo = getActiveImageProvider();
    } catch (providerError: any) {
      console.error('[generateImage] Failed to get active provider:', providerError.message);
      console.log('[generateImage] Falling back to placeholder');
      return {
        url: generatePlaceholder(prompt),
        provider: 'placeholder',
        generatedAt: Date.now(),
        metadata: { reason: 'No provider configured', error: providerError.message }
      };
    }
    
    const { provider, apiKey } = providerInfo;
    const style = options.style || '';
    const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt;
    
    console.log(`[generateImage] Using provider: ${provider}, API key length: ${apiKey.length}`);
    
    let result: MediaGenerationResult;
    
    switch (provider) {
      case 'dalle':
      case 'openai_dalle_next':
        console.log('[generateImage] Calling DALL-E 3');
        result = await generateDALLE3(apiKey, fullPrompt, options);
        break;
      
      case 'stability':
      case 'sd3':
        console.log('[generateImage] Calling Stability AI');
        result = await generateStabilityAI(apiKey, fullPrompt, options);
        break;
      
      case 'fal_flux':
      case 'black_forest_labs':
        console.log('[generateImage] Calling Flux AI');
        result = await generateFluxAI(apiKey, fullPrompt, options);
        break;
      
      case 'ideogram':
        console.log('[generateImage] Calling Ideogram');
        result = await generateIdeogram(apiKey, fullPrompt, options);
        break;
      
      case 'google':
      case 'imagen':
        console.log('[generateImage] Calling Imagen');
        result = await generateImagenAI(apiKey, fullPrompt, options);
        break;
      
      case 'replicate':
        console.log('[generateImage] Calling Replicate');
        result = await generateReplicate(apiKey, fullPrompt, options);
        break;
      
      case 'runware':
        console.log('[generateImage] Calling Runware');
        result = await generateRunware(apiKey, fullPrompt, options);
        break;
      
      case 'leonardo':
        console.log('[generateImage] Calling Leonardo');
        result = await generateLeonardo(apiKey, fullPrompt, options);
        break;
      
      default:
        console.warn(`[generateImage] Provider ${provider} not yet implemented, trying Stability AI fallback`);
        try {
          result = await generateStabilityAI(apiKey, fullPrompt, options);
        } catch (fallbackError) {
          console.warn('[generateImage] Fallback also failed, using placeholder');
          result = {
            url: generatePlaceholder(prompt),
            provider: 'placeholder',
            generatedAt: Date.now()
          };
        }
    }
    
    console.log(`[generateImage] ✓ Success with ${result.provider}: ${result.url.substring(0, 80)}`);
    return result;
    
  } catch (error: any) {
    console.error('[generateImage] Fatal error:', error.message, error.stack);
    const placeholder = generatePlaceholder(prompt);
    console.log('[generateImage] Returning placeholder:', placeholder);
    return {
      url: placeholder,
      provider: 'placeholder',
      generatedAt: Date.now()
    };
  }
}

/**
 * Generate image using DALL-E 3
 */
async function generateDALLE3(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
      throw new Error(`DALL-E API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.data[0].url;
    
    console.log('[generateDALLE3] ✓ Image generated');
    return {
      url,
      provider: 'dalle',
      generatedAt: Date.now(),
      metadata: { model: 'dall-e-3', size: options.size || '1024x1024' }
    };
  } catch (error: any) {
    console.error('[generateDALLE3] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Stability AI (Stable Diffusion)
 */
async function generateStabilityAI(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
    
    console.log('[generateStabilityAI] ✓ Image generated');
    return {
      url,
      provider: 'stability',
      generatedAt: Date.now(),
      metadata: { format: 'jpeg', size: options.size || '1024x1024' }
    };
  } catch (error: any) {
    console.error('[generateStabilityAI] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Flux AI (via fal.ai)
 */
async function generateFluxAI(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    // fal.ai Flux API
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
        guidance_scale: 7.5,
        enable_safety_checker: true
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Flux API error: ${error.detail || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.image?.url || data.output?.url || data.url;
    
    if (!url) {
      throw new Error('No image URL in Flux response');
    }
    
    console.log('[generateFluxAI] ✓ Image generated');
    return {
      url,
      provider: 'flux',
      generatedAt: Date.now(),
      metadata: { model: 'flux-pro', size: options.size || 'landscape_4_3' }
    };
  } catch (error: any) {
    console.error('[generateFluxAI] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Ideogram
 */
async function generateIdeogram(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
      throw new Error(`Ideogram API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.data?.[0]?.url || data.image_url;
    
    if (!url) {
      throw new Error('No image URL in Ideogram response');
    }
    
    console.log('[generateIdeogram] ✓ Image generated');
    return {
      url,
      provider: 'ideogram',
      generatedAt: Date.now(),
      metadata: { model: 'V_2_TURBO' }
    };
  } catch (error: any) {
    console.error('[generateIdeogram] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Google Imagen
 */
async function generateImagenAI(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_medium_and_above'
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Imagen API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.predictions?.[0]?.bytesBase64Encoded 
      ? `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
      : data.predictions?.[0]?.imageUri;
    
    if (!url) {
      throw new Error('No image URL in Imagen response');
    }
    
    console.log('[generateImagenAI] ✓ Image generated');
    return {
      url,
      provider: 'imagen',
      generatedAt: Date.now(),
      metadata: { model: 'imagen-3.0-generate-001' }
    };
  } catch (error: any) {
    console.error('[generateImagenAI] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Replicate
 */
async function generateReplicate(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'f1769f2b3253b5c92f09ff12d90e5828b2ac37f6',
        input: { prompt }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${error.detail || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.output?.[0] || data.output;
    
    if (!url) {
      throw new Error('No image URL in Replicate response');
    }
    
    console.log('[generateReplicate] ✓ Image generated');
    return {
      url,
      provider: 'replicate',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generateReplicate] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Runware
 */
async function generateRunware(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    const response = await fetch('https://api.runware.ai/v1/image/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'flux-pro',
        prompt,
        height: 1024,
        width: 1024
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Runware API error: ${error.error || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.images?.[0]?.url || data.output?.[0]?.url;
    
    if (!url) {
      throw new Error('No image URL in Runware response');
    }
    
    console.log('[generateRunware] ✓ Image generated');
    return {
      url,
      provider: 'runware',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generateRunware] Error:', error.message);
    throw error;
  }
}

/**
 * Generate image using Leonardo.Ai
 */
async function generateLeonardo(
  apiKey: string,
  prompt: string,
  options: ImageGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    const response = await fetch('https://api.leonardo.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        modelId: 'b820ea41-d8a3-4cb4-a378-54c9e40af08f',
        num_images: 1,
        height: 1024,
        width: 1024
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Leonardo API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.generationsByPk?.generated_images?.[0]?.url || data.sdGenerationJob?.generatedImages?.[0]?.url;
    
    if (!url) {
      throw new Error('No image URL in Leonardo response');
    }
    
    console.log('[generateLeonardo] ✓ Image generated');
    return {
      url,
      provider: 'leonardo',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generateLeonardo] Error:', error.message);
    throw error;
  }
}

/**
 * Generate video using real providers
 */
export async function generateVideo(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<MediaGenerationResult | null> {
  try {
    const videoProvider = getActiveVideoProvider();
    if (!videoProvider) {
      console.warn('[generateVideo] No video provider available');
      return null;
    }
    
    const { provider, apiKey } = videoProvider;
    console.log(`[generateVideo] Using provider: ${provider}`);
    
    switch (provider) {
      case 'runway':
        return await generateRunwayVideo(apiKey, prompt, options);
      
      case 'luma':
        return await generateLumaVideo(apiKey, prompt, options);
      
      case 'sora2':
        return await generateSoraVideo(apiKey, prompt, options);
      
      case 'kling':
        return await generateKlingVideo(apiKey, prompt, options);
      
      case 'pika':
        return await generatePikaVideo(apiKey, prompt, options);
      
      case 'ltx2':
      case 'wan':
      case 'mochi':
        return await generateFalVideo(apiKey, prompt, provider, options);
      
      default:
        console.warn(`[generateVideo] Provider ${provider} video generation not yet implemented`);
        return null;
    }
  } catch (error: any) {
    console.error('[generateVideo] Error:', error.message);
    return null;
  }
}

/**
 * Generate video using Runway ML
 */
async function generateRunwayVideo(
  apiKey: string,
  prompt: string,
  options: VideoGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
        motion: 5,
        seed: options.seed
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Runway API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.video?.url || data.output?.video || data.url;
    
    if (!url) {
      throw new Error('No video URL in Runway response');
    }
    
    console.log('[generateRunwayVideo] ✓ Video generated');
    return {
      url,
      provider: 'runway',
      generatedAt: Date.now(),
      metadata: { duration: options.duration || 5, fps: options.fps || 30 }
    };
  } catch (error: any) {
    console.error('[generateRunwayVideo] Error:', error.message);
    throw error;
  }
}

/**
 * Generate video using Luma AI
 */
async function generateLumaVideo(
  apiKey: string,
  prompt: string,
  options: VideoGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
      throw new Error(`Luma API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.video?.url || data.asset?.video_url || data.url;
    
    if (!url) {
      throw new Error('No video URL in Luma response');
    }
    
    console.log('[generateLumaVideo] ✓ Video generated');
    return {
      url,
      provider: 'luma',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generateLumaVideo] Error:', error.message);
    throw error;
  }
}

/**
 * Generate video using OpenAI Sora (via authorized endpoint)
 */
async function generateSoraVideo(
  apiKey: string,
  prompt: string,
  options: VideoGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        prompt,
        duration: options.duration || 60
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Sora API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.data?.url || data.url;
    
    if (!url) {
      throw new Error('No video URL in Sora response');
    }
    
    console.log('[generateSoraVideo] ✓ Video generated');
    return {
      url,
      provider: 'sora',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generateSoraVideo] Error:', error.message);
    throw error;
  }
}

/**
 * Generate video using Kling AI
 */
async function generateKlingVideo(
  apiKey: string,
  prompt: string,
  options: VideoGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
      throw new Error(`Kling API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.data?.videos?.[0]?.url || data.output?.video;
    
    if (!url) {
      throw new Error('No video URL in Kling response');
    }
    
    console.log('[generateKlingVideo] ✓ Video generated');
    return {
      url,
      provider: 'kling',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generateKlingVideo] Error:', error.message);
    throw error;
  }
}

/**
 * Generate video using Pika AI
 */
async function generatePikaVideo(
  apiKey: string,
  prompt: string,
  options: VideoGenerationOptions
): Promise<MediaGenerationResult> {
  try {
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
      throw new Error(`Pika API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.output?.[0]?.url || data.video?.url;
    
    if (!url) {
      throw new Error('No video URL in Pika response');
    }
    
    console.log('[generatePikaVideo] ✓ Video generated');
    return {
      url,
      provider: 'pika',
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error('[generatePikaVideo] Error:', error.message);
    throw error;
  }
}

/**
 * Generate video using fal.ai for LTX-2, WAN, Mochi
 */
async function generateFalVideo(
  apiKey: string,
  prompt: string,
  model: string,
  options: VideoGenerationOptions
): Promise<MediaGenerationResult> {
  try {
    const modelMap: Record<string, string> = {
      'ltx2': 'fal-ai/ltx-video',
      'wan': 'fal-ai/wan-2.1',
      'mochi': 'fal-ai/mochi-1'
    };
    
    const endpoint = `https://fal.run/${modelMap[model] || 'fal-ai/ltx-video'}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        duration: options.duration || 6,
        width: options.resolution === '1080p' ? 1920 : 1280,
        height: options.resolution === '1080p' ? 1080 : 720
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`FAL ${model} API error: ${error.detail || response.statusText}`);
    }
    
    const data = await response.json();
    const url = data.video?.url || data.output?.video || data.url;
    
    if (!url) {
      throw new Error(`No video URL in ${model} response`);
    }
    
    console.log(`[generateFalVideo] ✓ ${model} video generated`);
    return {
      url,
      provider: model,
      generatedAt: Date.now(),
      metadata: { model, duration: options.duration || 6 }
    };
  } catch (error: any) {
    console.error(`[generateFalVideo] Error:`, error.message);
    throw error;
  }
}

/**
 * Generate placeholder image
 */
function generatePlaceholder(prompt: string): string {
  return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 50))}`;
}

/**
 * Check if any media provider is configured
 */
export function hasMediaProviders(): boolean {
  try {
    const imageProvider = getActiveImageProvider();
    return !!imageProvider;
  } catch {
    return false;
  }
}

/**
 * Get all available media providers
 */
export function getAvailableMediaProviders(): { image: string[]; video: string[] } {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  const imageProviders: string[] = [];
  const videoProviders: string[] = [];
  
  if (settings.image) {
    Object.entries(settings.image).forEach(([key, config]: [string, any]) => {
      if (config.apiKey?.trim()) imageProviders.push(key);
    });
  }
  
  if (settings.video) {
    Object.entries(settings.video).forEach(([key, config]: [string, any]) => {
      if (config.apiKey?.trim()) videoProviders.push(key);
    });
  }
  
  return { image: imageProviders, video: videoProviders };
}
