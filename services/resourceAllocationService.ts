/**
 * Smart Resource Allocation Service
 * Estimates effort per story, prioritizes by ROI, allocates iterations dynamically
 */

import { CampaignUserStory, CampaignPRD } from './campaignPRDService';
import { sonicChat } from './sonicCoPilot';

export interface StoryEffortEstimate {
  storyId: string;
  title: string;
  estimatedHours: number;
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  recommendedIterations: number;
  roi: number;
}

export interface AllocationPlan {
  totalBudgetHours: number;
  allocations: StoryEffortEstimate[];
  priorityOrder: string[];
  riskMitigation: string[];
  budgetRemaining: number;
}

/**
 * Estimate effort for a story through recursive reasoning
 */
async function estimateStoryEffort(
  story: CampaignUserStory,
  brandName: string
): Promise<StoryEffortEstimate> {
  const estimationPrompt = `Estimate effort and risk for this campaign story:

Story: ${story.title}
Type: ${story.type}
Description: ${story.description}
Criteria: ${story.acceptanceCriteria.join('; ')}

Provide:
1. Estimated hours (1-8)
2. Complexity (low/medium/high)
3. Risk level (low/medium/high)
4. Recommended retry attempts (1-3)
5. Potential business ROI (1-10)

Respond ONLY with JSON:
{
  "estimatedHours": number,
  "complexity": "low|medium|high",
  "riskLevel": "low|medium|high",
  "recommendedIterations": number,
  "roiScore": number
}`;

  try {
    const { response } = await sonicChat(estimationPrompt, [], 'pro');
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const estimate = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    return {
      storyId: story.id,
      title: story.title,
      estimatedHours: estimate.estimatedHours || 3,
      complexity: estimate.complexity || 'medium',
      riskLevel: estimate.riskLevel || 'medium',
      recommendedIterations: estimate.recommendedIterations || 2,
      roi: estimate.roiScore || 5
    };
  } catch (error) {
    // Safe defaults
    return {
      storyId: story.id,
      title: story.title,
      estimatedHours: 3,
      complexity: 'medium',
      riskLevel: 'medium',
      recommendedIterations: 2,
      roi: 5
    };
  }
}

/**
 * Create allocation plan for PRD with budget constraints
 */
export async function createAllocationPlan(
  prd: CampaignPRD,
  totalBudgetHours: number,
  onProgress?: (msg: string) => void
): Promise<AllocationPlan> {
  if (onProgress) onProgress('Estimating effort for all stories...');

  // Estimate all stories
  const estimates: StoryEffortEstimate[] = [];
  for (const story of prd.userStories) {
    if (onProgress) onProgress(`Estimating: ${story.title}...`);
    const estimate = await estimateStoryEffort(story, prd.projectName);
    estimates.push(estimate);
  }

  // Calculate ROI per hour
  const estimatesWithEfficiency = estimates.map(e => ({
    ...e,
    roiPerHour: e.roi / (e.estimatedHours || 1)
  }));

  // Sort by ROI per hour (highest first)
  const prioritized = [...estimatesWithEfficiency].sort((a, b) => b.roiPerHour - a.roiPerHour);

  // Allocate budget
  const allocations: StoryEffortEstimate[] = [];
  let remaining = totalBudgetHours;

  for (const estimate of prioritized) {
    const budgetForStory = estimate.estimatedHours * estimate.recommendedIterations;
    allocations.push(estimate);
    remaining -= budgetForStory;
  }

  if (onProgress) onProgress('Generating risk mitigation strategy...');

  // Generate risk mitigation
  const highRiskStories = allocations.filter(e => e.riskLevel === 'high');
  const riskMitigation: string[] = [];

  for (const story of highRiskStories) {
    riskMitigation.push(`${story.title}: Allocate +${Math.ceil(story.estimatedHours * 0.5)}h buffer & early testing`);
  }

  return {
    totalBudgetHours,
    allocations,
    priorityOrder: prioritized.map(e => e.storyId),
    riskMitigation,
    budgetRemaining: remaining
  };
}

/**
 * Adjust iterations based on remaining budget
 */
export function adjustIterationsForBudget(
  plan: AllocationPlan,
  remainingHours: number
): AllocationPlan {
  if (remainingHours >= plan.budgetRemaining) {
    return plan; // Budget sufficient
  }

  const adjusted = { ...plan };
  const deficit = plan.budgetRemaining - remainingHours;
  let hoursRecovered = 0;

  // Reduce iterations for low-ROI items
  for (const allocation of adjusted.allocations.reverse()) {
    if (hoursRecovered >= deficit) break;

    if (allocation.recommendedIterations > 1) {
      const saved = allocation.estimatedHours;
      allocation.recommendedIterations = 1;
      hoursRecovered += saved;
    }
  }

  adjusted.budgetRemaining = Math.max(0, adjusted.budgetRemaining - hoursRecovered);
  return adjusted;
}

/**
 * Generate budget report
 */
export function getBudgetReport(plan: AllocationPlan): {
  totalEstimated: number;
  highROI: number;
  mediumROI: number;
  lowROI: number;
  highRiskCount: number;
  bufferRecommended: number;
} {
  const highROI = plan.allocations.filter(e => e.roi >= 7).length;
  const mediumROI = plan.allocations.filter(e => e.roi >= 4 && e.roi < 7).length;
  const lowROI = plan.allocations.filter(e => e.roi < 4).length;
  const highRiskCount = plan.allocations.filter(e => e.riskLevel === 'high').length;
  
  const baseHours = plan.allocations.reduce((sum, e) => sum + e.estimatedHours, 0);
  const bufferRecommended = Math.ceil(baseHours * 0.2); // 20% buffer

  return {
    totalEstimated: baseHours,
    highROI,
    mediumROI,
    lowROI,
    highRiskCount,
    bufferRecommended
  };
}
