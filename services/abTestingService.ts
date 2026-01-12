/**
 * Autonomous A/B Testing Service
 * Auto-generates variants, ranks by predicted performance, schedules winners
 */

import { CampaignAsset, BrandDNA } from '../types';
import { sonicChat } from './sonicCoPilot';

export interface AssetVariant {
  assetId: string;
  variantNum: number;
  title: string;
  content: string;
  cta: string;
  variant: 'A' | 'B' | 'C';
  predictedPerformance: number; // 0-100
  reasoning: string;
}

export interface ABTestPlan {
  originalAsset: CampaignAsset;
  variants: AssetVariant[];
  winnerVariant: string;
  winnerScore: number;
  predictedLift: string;
  recommendedSchedule: {
    control: string[];
    variant: string[];
  };
}

/**
 * Generate variants for A/B testing
 */
export async function generateVariants(
  asset: CampaignAsset,
  dna: BrandDNA,
  variationFocus: 'cta' | 'messaging' | 'tone' = 'cta',
  onProgress?: (msg: string) => void
): Promise<AssetVariant[]> {
  if (onProgress) onProgress('Generating A/B test variants...');

  const variantPrompt = `Generate 2 variants of this asset optimized for different ${variationFocus} approaches.

ORIGINAL ASSET:
Title: ${asset.title}
Content: ${asset.content}
CTA: ${asset.cta}

BRAND: ${dna.name}
Tone: ${dna.toneOfVoice?.description}
Target: ${dna.targetAudience}

Optimize variants for:
- Variant A: ${variationFocus === 'cta' ? 'Action-oriented, direct CTA' : variationFocus === 'messaging' ? 'Benefit-focused messaging' : 'Conversational, friendly tone'}
- Variant B: ${variationFocus === 'cta' ? 'Curiosity-driven CTA' : variationFocus === 'messaging' ? 'Feature-focused messaging' : 'Professional, authoritative tone'}

For each, provide predicted performance (0-100) and reasoning.

Respond ONLY with JSON:
{
  "variants": [
    {
      "variantNum": 1,
      "title": "variant title",
      "content": "variant content",
      "cta": "variant CTA",
      "predictedPerformance": 72,
      "reasoning": "why this performs better"
    },
    {
      "variantNum": 2,
      "title": "variant title",
      "content": "variant content",
      "cta": "variant CTA",
      "predictedPerformance": 68,
      "reasoning": "why this performs"
    }
  ]
}`;

  try {
    const { response } = await sonicChat(variantPrompt, [], 'pro');
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const data = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    const variants: AssetVariant[] = (data.variants || []).map((v: any, idx: number) => ({
      assetId: asset.id,
      variantNum: idx + 1,
      title: v.title,
      content: v.content,
      cta: v.cta,
      variant: ['A', 'B', 'C'][idx] as 'A' | 'B' | 'C',
      predictedPerformance: v.predictedPerformance || 50,
      reasoning: v.reasoning || ''
    }));

    if (onProgress) onProgress(`✓ Generated ${variants.length} variants`);
    return variants;
  } catch (error) {
    if (onProgress) onProgress('Variant generation failed, using defaults');
    return [];
  }
}

/**
 * Rank variants by predicted performance
 */
export function rankVariants(variants: AssetVariant[]): AssetVariant[] {
  return [...variants].sort((a, b) => b.predictedPerformance - a.predictedPerformance);
}

/**
 * Create A/B test plan with scheduling
 */
export async function createABTestPlan(
  asset: CampaignAsset,
  dna: BrandDNA,
  testDuration = 'week',
  onProgress?: (msg: string) => void
): Promise<ABTestPlan> {
  const variants = await generateVariants(asset, dna, 'cta', onProgress);
  const ranked = rankVariants(variants);

  const winner = ranked[0];
  const baseline = ranked[ranked.length - 1];
  const liftPercent = (
    (winner.predictedPerformance - baseline.predictedPerformance) /
    baseline.predictedPerformance *
    100
  ).toFixed(0);

  return {
    originalAsset: asset,
    variants,
    winnerVariant: winner.variant,
    winnerScore: winner.predictedPerformance,
    predictedLift: `+${liftPercent}% lift predicted`,
    recommendedSchedule: {
      control: ['Monday-Wednesday', 'Mornings'],
      variant: ['Thursday-Sunday', 'Afternoons']
    }
  };
}

/**
 * Batch create A/B plans for multiple assets
 */
export async function createABTestBatch(
  assets: CampaignAsset[],
  dna: BrandDNA,
  onProgress?: (msg: string) => void
): Promise<ABTestPlan[]> {
  const plans: ABTestPlan[] = [];

  for (let i = 0; i < assets.length; i++) {
    if (onProgress) onProgress(`Creating A/B plan ${i + 1}/${assets.length}...`);

    const plan = await createABTestPlan(assets[i], dna, 'week', onProgress);
    plans.push(plan);
  }

  return plans;
}

/**
 * Get A/B testing insights
 */
export function getABTestingInsights(plans: ABTestPlan[]) {
  const totalVariants = plans.reduce((sum, p) => sum + p.variants.length, 0);
  const avgLift = plans
    .map(p => parseInt(p.predictedLift.replace(/\D/g, '')))
    .reduce((a, b) => a + b, 0) / (plans.length || 1);

  const variantWins = new Map<string, number>();
  for (const plan of plans) {
    const count = variantWins.get(plan.winnerVariant) || 0;
    variantWins.set(plan.winnerVariant, count + 1);
  }

  return {
    totalAssetsToTest: plans.length,
    totalVariants,
    averagePredictedLift: Math.round(avgLift),
    winningVariantFrequency: Object.fromEntries(variantWins),
    testDuration: '7-14 days',
    recommendation: `A/B test all ${plans.length} assets. Variant A wins ${variantWins.get('A') || 0} times.`
  };
}
