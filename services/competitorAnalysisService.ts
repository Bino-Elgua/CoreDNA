/**
 * Recursive Competitor Analysis Service
 * Deep market research through multi-level LLM reasoning
 * Analyzes competitor positioning, gaps, pricing, messaging
 */

import { BrandDNA } from '../types';
import { sonicChat } from './sonicCoPilot';

export interface CompetitorProfile {
  name: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  messaging: string[];
  priceRange: string;
  targetAudience: string;
}

export interface MarketGap {
  gap: string;
  opportunity: string;
  brandFit: string;
  potentialROI: string;
}

export interface CompetitorAnalysis {
  targetBrand: string;
  marketSegment: string;
  competitors: CompetitorProfile[];
  marketGaps: MarketGap[];
  strategyRecommendations: string[];
  campaignInsights: string[];
  timestamp: number;
}

/**
 * Deep analyze market positioning through recursive reasoning
 */
export async function analyzeMarketRecursively(
  brand: BrandDNA,
  targetAudience: string,
  onProgress?: (msg: string) => void
): Promise<CompetitorAnalysis> {
  if (onProgress) onProgress('Phase 1: Identifying key competitors...');

  // Phase 1: Identify competitors
  const competitorPrompt = `For ${brand.name} (targeting "${targetAudience}"), identify 3-4 direct competitors.
Consider: market position, audience overlap, price tier, messaging style.

Respond ONLY with JSON:
{
  "competitors": [
    {
      "name": "competitor name",
      "positioning": "brief positioning",
      "targetAudience": "their target",
      "priceRange": "price tier"
    }
  ]
}`;

  const { response: compResponse } = await sonicChat(competitorPrompt, [], 'pro');
  let jsonStr = compResponse.trim();
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  const competitors = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}').competitors || [];

  if (onProgress) onProgress(`Phase 2: Deep analysis of ${competitors.length} competitors...`);

  // Phase 2: Analyze each competitor deeply
  const detailedProfiles: CompetitorProfile[] = [];

  for (const comp of competitors) {
    const detailPrompt = `Provide detailed analysis of competitor: ${comp.name}

Positioning: ${comp.positioning}
Target: ${comp.targetAudience}
Price: ${comp.priceRange}

Analyze:
1. Key strengths (what do they do well?)
2. Weaknesses (what are they missing?)
3. Messaging pillars (3-4 key messages they emphasize)
4. What ${brand.name} could learn from or differentiate against

Respond ONLY with JSON:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "messaging": ["message 1", "message 2"],
  "differentiation": "how to stand out"
}`;

    const { response: detailResponse } = await sonicChat(detailPrompt, [], 'pro');
    let detailStr = detailResponse.trim();
    if (detailStr.startsWith('```')) detailStr = detailStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const detail = JSON.parse(detailStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    detailedProfiles.push({
      name: comp.name,
      positioning: comp.positioning,
      strengths: detail.strengths || [],
      weaknesses: detail.weaknesses || [],
      messaging: detail.messaging || [],
      priceRange: comp.priceRange,
      targetAudience: comp.targetAudience
    });
  }

  if (onProgress) onProgress('Phase 3: Identifying market gaps...');

  // Phase 3: Identify gaps
  const gapPrompt = `Based on this competitive landscape, identify market gaps for ${brand.name}:

Competitors:
${detailedProfiles.map(c => `- ${c.name}: ${c.positioning} | Messaging: ${c.messaging.join(', ')}`).join('\n')}

Brand: ${brand.name}
Values: ${brand.values?.join(', ')}
Positioning: ${brand.tagline}

Find 3-4 underserved market segments or messaging angles.
For each: what is the gap? why ${brand.name} fits? potential ROI?

Respond ONLY with JSON:
{
  "gaps": [
    {
      "gap": "market gap description",
      "opportunity": "how to capitalize",
      "brandFit": "why brand fits",
      "potentialROI": "business impact"
    }
  ]
}`;

  const { response: gapResponse } = await sonicChat(gapPrompt, [], 'pro');
  let gapStr = gapResponse.trim();
  if (gapStr.startsWith('```')) gapStr = gapStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  const gaps = JSON.parse(gapStr.match(/\{[\s\S]*\}/)?.[0] || '{}').gaps || [];

  if (onProgress) onProgress('Phase 4: Generating campaign strategy...');

  // Phase 4: Generate recommendations
  const strategyPrompt = `Based on competitive analysis and market gaps, provide campaign strategy for ${brand.name}.

Targeting: ${targetAudience}
Gaps to fill: ${gaps.map(g => g.gap).join('; ')}
Competitors: ${detailedProfiles.map(c => c.name).join(', ')}

Provide:
1. 3 strategic campaign angles that competitors are NOT using
2. 3 messaging themes that differentiate from competition
3. 2-3 tactical recommendations for ${targetAudience}

Respond ONLY with JSON:
{
  "campaignAngles": ["angle 1", "angle 2", "angle 3"],
  "messagingThemes": ["theme 1", "theme 2", "theme 3"],
  "tacticalInsights": ["tactic 1", "tactic 2"]
}`;

  const { response: stratResponse } = await sonicChat(strategyPrompt, [], 'pro');
  let stratStr = stratResponse.trim();
  if (stratStr.startsWith('```')) stratStr = stratStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  const strategy = JSON.parse(stratStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

  if (onProgress) onProgress('✓ Competitive analysis complete');

  return {
    targetBrand: brand.name,
    marketSegment: targetAudience,
    competitors: detailedProfiles,
    marketGaps: gaps,
    strategyRecommendations: strategy.campaignAngles || [],
    campaignInsights: strategy.tacticalInsights || [],
    timestamp: Date.now()
  };
}

/**
 * Generate PRD insights from competitor analysis
 */
export function generatePRDFromCompetitorAnalysis(analysis: CompetitorAnalysis): {
  keyMessages: string[];
  positioningStatement: string;
  differentiationPoints: string[];
} {
  return {
    keyMessages: analysis.strategyRecommendations.slice(0, 3),
    positioningStatement: `${analysis.targetBrand} stands out by ${analysis.strategYRecommendations[0]?.toLowerCase() || 'delivering unique value'} in the ${analysis.marketSegment} space`,
    differentiationPoints: analysis.campaignInsights.slice(0, 3)
  };
}
