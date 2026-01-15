/**
 * Self-Healing Campaign Loop
 * Detects underperforming assets, analyzes failures recursively, and auto-regenerates improvements
 * Continues until validation passes or max attempts reached
 */

import { CampaignAsset, BrandDNA } from '../types';
import { sonicChat, SonicMessage } from './sonicCoPilot';
import { generateImage } from './mediaGenerationService';

export interface AssetValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  attemptCount: number;
  healed: boolean;
}

export interface HealingAttempt {
  attemptNum: number;
  timestamp: number;
  issues: string[];
  suggestions: string[];
  regeneratedAsset: CampaignAsset;
  validationResult: AssetValidationResult;
}

const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey?.trim()) {
    return settings.activeLLM;
  }
  
  if (settings.llms && Object.keys(settings.llms).length > 0) {
    for (const key of Object.keys(settings.llms)) {
      if (key !== 'google' && key !== 'gemini') {
        const llmConfig = settings.llms[key] as any;
        if (llmConfig?.apiKey?.trim()) return key;
      }
    }
    
    for (const [key, config] of Object.entries(settings.llms)) {
      const llmConfig = config as any;
      if (llmConfig?.apiKey?.trim()) return key;
    }
  }
  
  throw new Error('No LLM provider configured');
};

/**
 * Validate asset against brand guidelines and acceptance criteria
 * Returns detailed feedback for healing
 */
export async function validateAsset(
  asset: CampaignAsset,
  dna: BrandDNA,
  criteria?: string[]
): Promise<AssetValidationResult> {
  try {
    const validationPrompt = `As a marketing QA engineer, validate this campaign asset against brand guidelines and criteria.

BRAND: ${dna.name}
Brand Voice: ${dna.toneOfVoice?.description || 'professional'}
Brand Values: ${dna.values?.join(', ') || 'N/A'}

ASSET:
Title: ${asset.title}
Content: ${asset.content}
CTA: ${asset.cta}
Channel: ${asset.channel}
${criteria ? `\nAcceptance Criteria:\n${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

Respond ONLY with JSON (no markdown):
{
  "isValid": boolean,
  "score": number (0-100),
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["fix 1", "fix 2"],
  "reasoning": "brief explanation"
}

Be strict but constructive. Issues should be specific and actionable.`;

    const { response } = await sonicChat(validationPrompt, [], 'pro');
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid validation response');
    }
    
    const validation = JSON.parse(jsonMatch[0]);
    
    return {
      isValid: validation.isValid || validation.score >= 80,
      score: validation.score || 0,
      issues: validation.issues || [],
      suggestions: validation.suggestions || [],
      attemptCount: 1,
      healed: false
    };
  } catch (error: any) {
    console.error('[validateAsset]', error.message);
    // Graceful fallback
    return {
      isValid: false,
      score: 50,
      issues: ['Validation check failed'],
      suggestions: ['Regenerate asset with clearer messaging'],
      attemptCount: 1,
      healed: false
    };
  }
}

/**
 * Self-heal an asset by analyzing failures and regenerating
 * Recursively improves until valid or max attempts reached
 */
export async function healAsset(
  asset: CampaignAsset,
  dna: BrandDNA,
  criteria?: string[],
  maxAttempts = 3,
  onProgress?: (msg: string) => void
): Promise<{ asset: CampaignAsset; healing: HealingAttempt[] }> {
  const healingAttempts: HealingAttempt[] = [];
  let currentAsset = { ...asset };
  let validationResult = await validateAsset(currentAsset, dna, criteria);

  if (validationResult.isValid) {
    return { asset: currentAsset, healing: healingAttempts };
  }

  for (let attempt = 1; attempt < maxAttempts; attempt++) {
    if (onProgress) onProgress(`Healing attempt ${attempt}/${maxAttempts - 1}...`);

    try {
      // Regenerate asset based on feedback
      const healedAsset = await regenerateWithFeedback(
        currentAsset,
        dna,
        validationResult,
        attempt
      );

      // Validate regenerated asset
      const newValidation = await validateAsset(healedAsset, dna, criteria);

      healingAttempts.push({
        attemptNum: attempt,
        timestamp: Date.now(),
        issues: validationResult.issues,
        suggestions: validationResult.suggestions,
        regeneratedAsset: healedAsset,
        validationResult: newValidation
      });

      if (newValidation.isValid) {
        if (onProgress) onProgress(`✓ Asset healed on attempt ${attempt}`);
        currentAsset = healedAsset;
        validationResult = newValidation;
        validationResult.healed = true;
        break;
      }

      currentAsset = healedAsset;
      validationResult = newValidation;
    } catch (error: any) {
      console.error(`[healAsset] Attempt ${attempt} failed:`, error.message);
      if (onProgress) onProgress(`Attempt ${attempt} failed, retrying...`);
    }
  }

  return {
    asset: currentAsset,
    healing: healingAttempts
  };
}

/**
 * Regenerate asset based on validation feedback
 */
async function regenerateWithFeedback(
  asset: CampaignAsset,
  dna: BrandDNA,
  validation: AssetValidationResult,
  attemptNum: number
): Promise<CampaignAsset> {
  const regenerationPrompt = `Improve this campaign asset based on specific feedback.

ORIGINAL ASSET:
Title: ${asset.title}
Content: ${asset.content}
CTA: ${asset.cta}

ISSUES FOUND:
${validation.issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

SUGGESTIONS:
${validation.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

BRAND CONTEXT:
Name: ${dna.name}
Voice: ${dna.toneOfVoice?.description}
Values: ${dna.values?.join(', ')}

Regenerate the asset addressing ALL issues. This is attempt ${attemptNum}.
Response ONLY with JSON (no markdown):
{
  "title": "improved headline",
  "content": "improved body text (100-150 chars)",
  "cta": "improved call-to-action"
}`;

  const { response } = await sonicChat(regenerationPrompt, [], 'pro');
  
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }
  
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid regeneration response');
  }
  
  const improved = JSON.parse(jsonMatch[0]);
  
  // Regenerate image if needed
  let imageUrl = asset.imageUrl;
  if (asset.imagePrompt) {
    try {
      const result = await generateImage(asset.imagePrompt, { style: dna.visualStyle?.description || 'modern' });
      imageUrl = result.url;
    } catch (e) {
      console.warn('[regenerateWithFeedback] Image generation failed, keeping original');
    }
  }
  
  return {
    ...asset,
    title: improved.title || asset.title,
    content: improved.content || asset.content,
    cta: improved.cta || asset.cta,
    imageUrl,
    notes: `Healed on attempt ${attemptNum}`
  };
}

/**
 * Batch heal multiple assets
 */
export async function healAssetBatch(
  assets: CampaignAsset[],
  dna: BrandDNA,
  maxAttemptsPerAsset = 3,
  onProgress?: (msg: string) => void
): Promise<{
  healed: CampaignAsset[];
  failures: { asset: CampaignAsset; reason: string }[];
}> {
  const healed: CampaignAsset[] = [];
  const failures: { asset: CampaignAsset; reason: string }[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    if (onProgress) onProgress(`Healing asset ${i + 1}/${assets.length}...`);

    try {
      const result = await healAsset(asset, dna, undefined, maxAttemptsPerAsset, onProgress);
      const validation = await validateAsset(result.asset, dna);

      if (validation.isValid) {
        healed.push(result.asset);
      } else {
        failures.push({
          asset: result.asset,
          reason: `Failed validation after ${maxAttemptsPerAsset} attempts (score: ${validation.score})`
        });
      }
    } catch (error: any) {
      failures.push({
        asset,
        reason: error.message
      });
    }
  }

  return { healed, failures };
}

/**
 * Get healing history/stats
 */
export function getHealingStats(attempts: HealingAttempt[]) {
  const totalAttempts = attempts.length;
  const successfulHeals = attempts.filter(a => a.validationResult.isValid).length;
  const avgScore = attempts.reduce((sum, a) => sum + a.validationResult.score, 0) / (totalAttempts || 1);

  return {
    totalAttempts,
    successfulHeals,
    healingRate: totalAttempts > 0 ? (successfulHeals / totalAttempts) * 100 : 0,
    avgScore: Math.round(avgScore),
    issues: Array.from(
      new Set(attempts.flatMap(a => a.issues))
    )
  };
}
