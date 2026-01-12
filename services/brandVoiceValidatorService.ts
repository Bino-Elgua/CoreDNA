/**
 * Brand Voice Consistency Validator Service
 * Cross-validates all generated assets against brand guidelines
 * Flags inconsistencies and suggests corrections
 */

import { CampaignAsset, BrandDNA } from '../types';
import { sonicChat } from './sonicCoPilot';

export interface VoiceCheckResult {
  assetId: string;
  assetTitle: string;
  isConsistent: boolean;
  consistency: number; // 0-100
  issues: VoiceIssue[];
  suggestions: VoiceSuggestion[];
  confidence: number;
}

export interface VoiceIssue {
  dimension: 'tone' | 'messaging' | 'style' | 'values' | 'visual';
  severity: 'critical' | 'major' | 'minor';
  description: string;
}

export interface VoiceSuggestion {
  issue: string;
  suggestion: string;
  correctedText?: string;
  brandJustification: string;
}

/**
 * Validate single asset against brand voice
 */
export async function validateBrandVoice(
  asset: CampaignAsset,
  dna: BrandDNA
): Promise<VoiceCheckResult> {
  const validationPrompt = `As a brand consistency auditor, validate this asset against the brand guidelines.

BRAND: ${dna.name}
Tone: ${dna.toneOfVoice?.description}
Values: ${dna.values?.join(', ')}
Key Messages: ${dna.keyMessaging?.join('; ')}
Target: ${dna.targetAudience}

ASSET:
Title: ${asset.title}
Content: ${asset.content}
CTA: ${asset.cta}
Channel: ${asset.channel}

Check consistency across:
1. Tone (does it match brand voice?)
2. Messaging (does it reinforce key messages?)
3. Style (appropriate for channel/brand?)
4. Values (does it reflect brand values?)

Respond ONLY with JSON:
{
  "isConsistent": boolean,
  "consistency": number,
  "issues": [
    {
      "dimension": "tone|messaging|style|values|visual",
      "severity": "critical|major|minor",
      "description": "what's wrong"
    }
  ],
  "suggestions": [
    {
      "issue": "which issue to fix",
      "suggestion": "how to fix it",
      "correctedText": "improved version",
      "brandJustification": "why this aligns better"
    }
  ],
  "confidence": 0.8
}`;

  try {
    const { response } = await sonicChat(validationPrompt, [], 'pro');
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const result = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    return {
      assetId: asset.id,
      assetTitle: asset.title,
      isConsistent: result.isConsistent || false,
      consistency: result.consistency || 50,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      confidence: result.confidence || 0.7
    };
  } catch (error) {
    return {
      assetId: asset.id,
      assetTitle: asset.title,
      isConsistent: false,
      consistency: 0,
      issues: [{ dimension: 'tone', severity: 'major', description: 'Validation check failed' }],
      suggestions: [],
      confidence: 0
    };
  }
}

/**
 * Cross-validate multiple assets for consistency
 */
export async function validateBrandVoiceBatch(
  assets: CampaignAsset[],
  dna: BrandDNA,
  onProgress?: (msg: string) => void
): Promise<{
  results: VoiceCheckResult[];
  consistencyRate: number;
  commonIssues: VoiceIssue[];
}> {
  const results: VoiceCheckResult[] = [];
  const allIssues: VoiceIssue[] = [];

  for (let i = 0; i < assets.length; i++) {
    if (onProgress) onProgress(`Validating asset ${i + 1}/${assets.length}...`);

    const result = await validateBrandVoice(assets[i], dna);
    results.push(result);
    allIssues.push(...result.issues);
  }

  // Find most common issues
  const issueCounts = new Map<string, VoiceIssue>();
  for (const issue of allIssues) {
    const key = `${issue.dimension}:${issue.description}`;
    if (!issueCounts.has(key)) {
      issueCounts.set(key, issue);
    }
  }

  const consistencyRate = results.filter(r => r.isConsistent).length / (results.length || 1) * 100;

  return {
    results,
    consistencyRate: Math.round(consistencyRate),
    commonIssues: Array.from(issueCounts.values()).slice(0, 5)
  };
}

/**
 * Generate brand voice guidelines report
 */
export function generateVoiceReport(results: VoiceCheckResult[]): {
  overallConsistency: number;
  issuesByDimension: Map<string, number>;
  criticalIssues: VoiceCheckResult[];
  recommendations: string[];
} {
  const overallConsistency = Math.round(
    results.reduce((sum, r) => sum + r.consistency, 0) / (results.length || 1)
  );

  const issuesByDimension = new Map<string, number>();
  const criticalIssues: VoiceCheckResult[] = [];

  for (const result of results) {
    for (const issue of result.issues) {
      const count = issuesByDimension.get(issue.dimension) || 0;
      issuesByDimension.set(issue.dimension, count + 1);

      if (issue.severity === 'critical') {
        criticalIssues.push(result);
      }
    }
  }

  const recommendations: string[] = [];
  if (overallConsistency < 70) {
    recommendations.push('Consider brand voice refresher training for content team');
  }
  if (issuesByDimension.get('messaging') || 0 > 3) {
    recommendations.push('Strengthen key messaging alignment across all assets');
  }
  if (criticalIssues.length > 0) {
    recommendations.push(`Address ${criticalIssues.length} critical issues before publishing`);
  }

  return {
    overallConsistency,
    issuesByDimension,
    criticalIssues,
    recommendations
  };
}
