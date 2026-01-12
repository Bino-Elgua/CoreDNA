/**
 * Multi-iteration Asset Refinement Service
 * Recursively improves assets through multiple refinement cycles
 * Uses reasoning to understand what needs improvement and how to fix it
 */

import { CampaignAsset, BrandDNA } from '../types';
import { sonicChat } from './sonicCoPilot';
import { generateImage } from './mediaGenerationService';

export interface RefinementIteration {
  iterationNum: number;
  timestamp: number;
  feedback: string;
  improvements: string[];
  asset: CampaignAsset;
  qualityScore: number;
}

export interface RefinementResult {
  originalAsset: CampaignAsset;
  refinedAsset: CampaignAsset;
  iterations: RefinementIteration[];
  totalIterations: number;
  improvementPercent: number;
}

/**
 * Score asset quality across multiple dimensions
 */
async function scoreAssetQuality(
  asset: CampaignAsset,
  dna: BrandDNA
): Promise<{
  clarity: number;
  engagement: number;
  brandAlignment: number;
  cta_strength: number;
  overall: number;
}> {
  const scoringPrompt = `Rate this asset on specific quality dimensions (0-100 each):

ASSET:
Title: ${asset.title}
Content: ${asset.content}
CTA: ${asset.cta}

BRAND: ${dna.name}
Voice: ${dna.toneOfVoice?.description}

Respond ONLY with JSON:
{
  "clarity": number,
  "engagement": number,
  "brandAlignment": number,
  "cta_strength": number,
  "reasoning": "brief explanation"
}`;

  try {
    const { response } = await sonicChat(scoringPrompt, [], 'pro');
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid scoring response');
    
    const scores = JSON.parse(jsonMatch[0]);
    const overall = (scores.clarity + scores.engagement + scores.brandAlignment + scores.cta_strength) / 4;
    
    return {
      clarity: scores.clarity || 70,
      engagement: scores.engagement || 70,
      brandAlignment: scores.brandAlignment || 70,
      cta_strength: scores.cta_strength || 70,
      overall: Math.round(overall)
    };
  } catch (error) {
    return {
      clarity: 70,
      engagement: 70,
      brandAlignment: 70,
      cta_strength: 70,
      overall: 70
    };
  }
}

/**
 * Refine asset iteratively based on quality gaps
 */
export async function refineAssetIteratively(
  asset: CampaignAsset,
  dna: BrandDNA,
  targetQuality = 85,
  maxIterations = 5,
  onProgress?: (msg: string) => void
): Promise<RefinementResult> {
  const iterations: RefinementIteration[] = [];
  let currentAsset = { ...asset };
  let previousScore = 0;

  // Generate initial image if imagePrompt exists
  if (currentAsset.imagePrompt && !currentAsset.imageUrl) {
    try {
      if (onProgress) onProgress('Generating initial asset image...');
      const imageResult = await generateImage(currentAsset.imagePrompt, { style: dna.visualStyle?.description });
      currentAsset.imageUrl = imageResult.url;
    } catch (error: any) {
      console.warn('[refineAssetIteratively] Initial image generation failed:', error.message);
    }
  }

  for (let i = 1; i <= maxIterations; i++) {
    if (onProgress) onProgress(`Refinement iteration ${i}/${maxIterations}...`);

    try {
      const scores = await scoreAssetQuality(currentAsset, dna);
      
      if (scores.overall >= targetQuality) {
        if (onProgress) onProgress(`✓ Reached target quality (${scores.overall}/100)`);
        return {
          originalAsset: asset,
          refinedAsset: currentAsset,
          iterations,
          totalIterations: i,
          improvementPercent: scores.overall - previousScore
        };
      }

      // Identify weakest dimension
      const dimensions = {
        clarity: scores.clarity,
        engagement: scores.engagement,
        'brand alignment': scores.brandAlignment,
        'CTA strength': scores.cta_strength
      };
      
      const weakest = Object.entries(dimensions).sort(([,a], [,b]) => a - b)[0];
      
      const feedbackPrompt = `This asset scored ${scores.overall}/100. The weakest area is "${weakest[0]}" (${weakest[1]}/100).

CURRENT ASSET:
Title: ${currentAsset.title}
Content: ${currentAsset.content}
CTA: ${currentAsset.cta}

WEAKEST DIMENSION: ${weakest[0]} (${weakest[1]}/100)
SCORES: Clarity ${scores.clarity} | Engagement ${scores.engagement} | Brand Alignment ${scores.brandAlignment} | CTA ${scores.cta_strength}

Provide specific, actionable improvements to boost ${weakest[0]}.
Focus on WHAT specifically needs improvement and HOW to fix it.

Response ONLY with JSON:
{
  "feedback": "specific feedback",
  "improvements": ["improvement 1", "improvement 2"],
  "newTitle": "refined title",
  "newContent": "refined content",
  "newCta": "refined CTA"
}`;

      const { response: feedbackResponse } = await sonicChat(feedbackPrompt, [], 'pro');
      
      let jsonStr = feedbackResponse.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid feedback response');
      
      const feedback = JSON.parse(jsonMatch[0]);

      currentAsset = {
        ...currentAsset,
        title: feedback.newTitle || currentAsset.title,
        content: feedback.newContent || currentAsset.content,
        cta: feedback.newCta || currentAsset.cta
      };
      
      // Regenerate image if prompt was updated
      if (feedback.newImagePrompt && feedback.newImagePrompt !== currentAsset.imagePrompt) {
        try {
          if (onProgress) onProgress(`Regenerating image based on iteration ${i} feedback...`);
          const imageResult = await generateImage(feedback.newImagePrompt, { style: dna.visualStyle?.description });
          currentAsset.imageUrl = imageResult.url;
          currentAsset.imagePrompt = feedback.newImagePrompt;
        } catch (error: any) {
          console.warn(`[refineAssetIteratively] Image regeneration failed:`, error.message);
        }
      }

      iterations.push({
        iterationNum: i,
        timestamp: Date.now(),
        feedback: feedback.feedback,
        improvements: feedback.improvements || [],
        asset: { ...currentAsset },
        qualityScore: scores.overall
      });

      previousScore = scores.overall;

    } catch (error: any) {
      console.error(`[refineAssetIteratively] Iteration ${i} failed:`, error.message);
      if (onProgress) onProgress(`Iteration ${i} encountered an error`);
    }
  }

  return {
    originalAsset: asset,
    refinedAsset: currentAsset,
    iterations,
    totalIterations: maxIterations,
    improvementPercent: previousScore - (await scoreAssetQuality(asset, dna)).overall
  };
}

/**
 * Batch refine multiple assets
 */
export async function refineAssetBatch(
  assets: CampaignAsset[],
  dna: BrandDNA,
  targetQuality = 85,
  maxIterations = 5,
  onProgress?: (msg: string) => void
): Promise<RefinementResult[]> {
  const results: RefinementResult[] = [];

  for (let i = 0; i < assets.length; i++) {
    if (onProgress) onProgress(`Refining asset ${i + 1}/${assets.length}...`);

    const result = await refineAssetIteratively(
      assets[i],
      dna,
      targetQuality,
      maxIterations,
      onProgress
    );
    results.push(result);
  }

  return results;
}

/**
 * Compare before/after metrics
 */
export function getRefinementStats(results: RefinementResult[]) {
  const totalRefined = results.length;
  const totalIterationsUsed = results.reduce((sum, r) => sum + r.totalIterations, 0);
  const avgImprovement = results.reduce((sum, r) => sum + r.improvementPercent, 0) / (totalRefined || 1);
  const assetsImproved = results.filter(r => r.improvementPercent > 5).length;

  return {
    totalRefined,
    totalIterationsUsed,
    avgIterationsPerAsset: Math.round(totalIterationsUsed / (totalRefined || 1)),
    avgImprovement: Math.round(avgImprovement),
    assetsImproved,
    improvementRate: totalRefined > 0 ? (assetsImproved / totalRefined) * 100 : 0
  };
}
