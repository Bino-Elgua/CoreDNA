/**
 * AI Router - Main Export
 * Clean category-split router for all AI operations
 * 
 * Usage:
 *   import { generateText, generateImage, generateVideo } from '@/services/ai/router'
 *   
 *   const text = await generateText('Write a headline');
 *   const image = await generateImage('Blue mountain landscape');
 *   const video = await generateVideo('Sunset over ocean');
 */

export { generateText } from './textRouter';
export { generateImage, type ImageGenerationResult } from './imageRouter';
export { generateVideo, type VideoGenerationResult } from './videoRouter';
export { getActiveProvider, getApiKey, hasProvider } from './settingsService';
