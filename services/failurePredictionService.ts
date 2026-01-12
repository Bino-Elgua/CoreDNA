/**
 * Predictive Failure Prevention Service
 * Analyzes stories before execution, predicts failure likelihood
 * Suggests preventive improvements
 */

import { CampaignUserStory, CampaignPRD } from './campaignPRDService';
import { sonicChat } from './sonicCoPilot';

export interface FailureRisk {
  storyId: string;
  storyTitle: string;
  riskScore: number; // 0-100
  failureLikelihood: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  preventiveMeasures: string[];
  recommendedIterations: number;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

/**
 * Predict failure risk for a story
 */
export async function predictStoryFailure(
  story: CampaignUserStory,
  brandContext?: string
): Promise<FailureRisk> {
  const predictionPrompt = `Predict execution failure risk for this campaign story.

Story: ${story.title}
Type: ${story.type}
Description: ${story.description}
Criteria: ${story.acceptanceCriteria.join('; ')}
Channel: ${story.channel}

Analyze:
1. Complexity factors
2. Common failure points for this story type
3. Acceptance criteria clarity
4. Channel-specific risks
5. Dependencies/blockers

Identify specific risks and mitigation strategies.

Respond ONLY with JSON:
{
  "riskScore": 65,
  "failureLikelihood": "low|medium|high",
  "riskFactors": [
    {
      "factor": "factor name",
      "severity": "low|medium|high",
      "description": "what could go wrong",
      "mitigation": "how to prevent it"
    }
  ],
  "preventiveMeasures": ["measure 1", "measure 2"],
  "recommendedIterations": 2
}`;

  try {
    const { response } = await sonicChat(predictionPrompt, [], 'pro');
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const prediction = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    return {
      storyId: story.id,
      storyTitle: story.title,
      riskScore: prediction.riskScore || 50,
      failureLikelihood: prediction.failureLikelihood || 'medium',
      riskFactors: prediction.riskFactors || [],
      preventiveMeasures: prediction.preventiveMeasures || [],
      recommendedIterations: prediction.recommendedIterations || 2
    };
  } catch (error) {
    return {
      storyId: story.id,
      storyTitle: story.title,
      riskScore: 50,
      failureLikelihood: 'medium',
      riskFactors: [
        {
          factor: 'Unknown complexity',
          severity: 'medium',
          description: 'Could not fully analyze story',
          mitigation: 'Allocate extra iteration attempts'
        }
      ],
      preventiveMeasures: ['Allocate +1 iteration', 'Early validation'],
      recommendedIterations: 2
    };
  }
}

/**
 * Pre-execution risk assessment for entire PRD
 */
export async function assessPRDRisks(
  prd: CampaignPRD,
  onProgress?: (msg: string) => void
): Promise<{
  risks: FailureRisk[];
  highRiskStories: FailureRisk[];
  averageRiskScore: number;
  riskMitigation: string[];
  recommendedBudgetBuffer: number;
}> {
  const risks: FailureRisk[] = [];
  const highRiskStories: FailureRisk[] = [];

  for (let i = 0; i < prd.userStories.length; i++) {
    if (onProgress) onProgress(`Assessing story ${i + 1}/${prd.userStories.length}...`);

    const risk = await predictStoryFailure(prd.userStories[i]);
    risks.push(risk);

    if (risk.failureLikelihood === 'high') {
      highRiskStories.push(risk);
    }
  }

  const averageRiskScore = Math.round(
    risks.reduce((sum, r) => sum + r.riskScore, 0) / (risks.length || 1)
  );

  // Generate mitigation plan
  const riskMitigation: string[] = [];

  if (highRiskStories.length > 0) {
    riskMitigation.push(
      `${highRiskStories.length} high-risk stories detected: ${highRiskStories.map(r => r.storyTitle).join(', ')}`
    );
  }

  if (averageRiskScore > 70) {
    riskMitigation.push('Consider increasing total iteration budget by 30%');
  }

  const topFactors = new Map<string, number>();
  for (const risk of risks) {
    for (const factor of risk.riskFactors) {
      const key = factor.factor;
      topFactors.set(key, (topFactors.get(key) || 0) + 1);
    }
  }

  const mostCommonFactor = Array.from(topFactors.entries()).sort((a, b) => b[1] - a[1])[0];
  if (mostCommonFactor) {
    riskMitigation.push(`Most common risk: ${mostCommonFactor[0]} (${mostCommonFactor[1]} stories affected)`);
  }

  const bufferIterations = Math.ceil(highRiskStories.length * 1.5);
  const bufferHours = bufferIterations * 2;

  return {
    risks,
    highRiskStories,
    averageRiskScore,
    riskMitigation,
    recommendedBudgetBuffer: bufferHours
  };
}

/**
 * Apply preventive improvements to story before execution
 */
export async function applyPreventiveMeasures(
  story: CampaignUserStory,
  risk: FailureRisk
): Promise<CampaignUserStory> {
  if (risk.preventiveMeasures.length === 0) {
    return story;
  }

  const improvementPrompt = `Apply preventive measures to reduce failure risk:

Story: ${story.title}
Preventive Measures: ${risk.preventiveMeasures.join('; ')}

Suggest improvements to:
1. Acceptance criteria (make them more specific/measurable)
2. Story description (add clarity)
3. Technical approach (reduce complexity)

Respond ONLY with JSON:
{
  "improvedDescription": "enhanced description",
  "improvedCriteria": ["criteria 1", "criteria 2"],
  "approachNotes": "simplified approach"
}`;

  try {
    const { response } = await sonicChat(improvementPrompt, [], 'pro');
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const improvements = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    return {
      ...story,
      description: improvements.improvedDescription || story.description,
      acceptanceCriteria: improvements.improvedCriteria || story.acceptanceCriteria,
      notes: improvements.approachNotes || story.notes
    };
  } catch (error) {
    return story;
  }
}

/**
 * Get risk assessment report
 */
export function getRiskReport(assessment: {
  risks: FailureRisk[];
  highRiskStories: FailureRisk[];
  averageRiskScore: number;
}) {
  const lowRisk = assessment.risks.filter(r => r.failureLikelihood === 'low').length;
  const mediumRisk = assessment.risks.filter(r => r.failureLikelihood === 'medium').length;
  const highRisk = assessment.risks.filter(r => r.failureLikelihood === 'high').length;

  return {
    totalStories: assessment.risks.length,
    lowRiskCount: lowRisk,
    mediumRiskCount: mediumRisk,
    highRiskCount: highRisk,
    averageRiskScore: assessment.averageRiskScore,
    overallRiskLevel: assessment.averageRiskScore > 70 ? 'High' : assessment.averageRiskScore > 40 ? 'Medium' : 'Low',
    recommendation:
      highRisk > 0
        ? `Focus on ${highRisk} high-risk stories first. Apply preventive measures before execution.`
        : `Risk profile acceptable. Allocate standard iteration budget.`
  };
}
