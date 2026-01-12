/**
 * Context-Aware Campaign Sequencing Service
 * Understands dependencies between stories, optimizes execution order
 * Handles seasonal/timing constraints
 */

import { CampaignUserStory, CampaignPRD } from './campaignPRDService';
import { sonicChat } from './sonicCoPilot';
import { generateImage, generateVideo } from './mediaGenerationService';

export interface StoryDependency {
  storyId: string;
  dependsOn?: string[];
  blockedBy?: string[];
  timing?: {
    earliest?: Date;
    latest?: Date;
    duration?: number;
  };
}

export interface SequencedPlan {
  originalOrder: string[];
  optimizedOrder: string[];
  phases: Phase[];
  criticalPath: string[];
  parallelizable: string[][];
  riskMitigations: string[];
}

export interface Phase {
  phaseNum: number;
  name: string;
  stories: string[];
  duration: number;
  successCriteria: string[];
}

/**
 * Analyze story dependencies through recursive reasoning
 */
async function analyzeDependencies(prd: CampaignPRD): Promise<StoryDependency[]> {
  const dependencyPrompt = `Analyze execution dependencies for this campaign PRD.

Stories:
${prd.userStories.map(s => `- ${s.id}: ${s.title} (${s.type})`).join('\n')}

For each story, identify:
1. What must be done before it (dependencies)
2. What it blocks (dependent stories)
3. Timing constraints (seasonal, day-of-week, etc)

Respond ONLY with JSON:
{
  "dependencies": [
    {
      "storyId": "US-001",
      "dependsOn": ["US-000"],
      "blockedBy": [],
      "timing": {
        "earliest": "2024-01-15",
        "latest": "2024-01-20",
        "duration": 2
      }
    }
  ]
}`;

  try {
    const { response } = await sonicChat(dependencyPrompt, [], 'pro');
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    const data = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || '{}');

    return data.dependencies || prd.userStories.map(s => ({
      storyId: s.id,
      dependsOn: [],
      blockedBy: [],
      timing: { duration: s.estimatedHours || 2 }
    }));
  } catch (error) {
    return prd.userStories.map(s => ({
      storyId: s.id,
      dependsOn: [],
      blockedBy: [],
      timing: { duration: s.estimatedHours || 2 }
    }));
  }
}

/**
 * Build optimal execution sequence
 */
/**
 * Generate media for a story based on its type
 */
async function generateStoryMedia(story: CampaignUserStory, onProgress?: (msg: string) => void): Promise<{ imageUrl?: string; videoUrl?: string }> {
  const result: { imageUrl?: string; videoUrl?: string } = {};
  
  try {
    if (story.type === 'social' || story.type === 'design') {
      if (onProgress) onProgress(`Generating image for ${story.title}...`);
      
      const imagePrompt = `Create a professional marketing image for: ${story.title}. Description: ${story.description}. Style: modern and engaging.`;
      const imageResult = await generateImage(imagePrompt, { style: 'professional marketing' });
      result.imageUrl = imageResult.url;
    }
    
    if (story.type === 'video') {
      if (onProgress) onProgress(`Generating video for ${story.title}...`);
      
      const videoPrompt = `Create a professional marketing video for: ${story.title}. Description: ${story.description}`;
      const videoResult = await generateVideo(videoPrompt, { duration: 6 });
      if (videoResult) {
        result.videoUrl = videoResult.url;
      }
    }
  } catch (error: any) {
    console.warn(`[generateStoryMedia] Media generation failed for ${story.id}:`, error.message);
  }
  
  return result;
}

export async function buildOptimalSequence(
  prd: CampaignPRD,
  onProgress?: (msg: string) => void
): Promise<SequencedPlan> {
  if (onProgress) onProgress('Analyzing story dependencies...');

  const dependencies = await analyzeDependencies(prd);

  // Topological sort for execution order
  const visited = new Set<string>();
  const optimizedOrder: string[] = [];

  function visit(storyId: string) {
    if (visited.has(storyId)) return;
    visited.add(storyId);

    const deps = dependencies.find(d => d.storyId === storyId);
    if (deps?.dependsOn) {
      for (const depId of deps.dependsOn) {
        visit(depId);
      }
    }

    optimizedOrder.push(storyId);
  }

  for (const story of prd.userStories) {
    visit(story.id);
  }

  if (onProgress) onProgress('Identifying critical path...');

  // Find critical path (longest dependency chain)
  const criticalPath: string[] = [];
  let maxLength = 0;

  function calculateCriticalPath(storyId: string, path: string[]): string[] {
    const newPath = [...path, storyId];
    const deps = dependencies.find(d => d.storyId === storyId);

    if (!deps?.dependsOn || deps.dependsOn.length === 0) {
      if (newPath.length > maxLength) {
        maxLength = newPath.length;
        return newPath;
      }
      return [];
    }

    const paths = deps.dependsOn.map(d => calculateCriticalPath(d, newPath));
    return paths.reduce((max, p) => (p.length > max.length ? p : max), []);
  }

  for (const story of prd.userStories) {
    const path = calculateCriticalPath(story.id, []);
    if (path.length > criticalPath.length) {
      criticalPath.splice(0, criticalPath.length, ...path);
    }
  }

  if (onProgress) onProgress('Grouping into phases...');

  // Group into phases (stories that can run in parallel)
  const phases: Phase[] = [];
  let phaseNum = 1;

  const remaining = new Set(prd.userStories.map(s => s.id));
  const processed = new Set<string>();

  while (remaining.size > 0) {
    const currentPhase: string[] = [];

    for (const storyId of remaining) {
      const deps = dependencies.find(d => d.storyId === storyId);
      const allDepsSatisfied = !deps?.dependsOn || deps.dependsOn.every(d => processed.has(d));

      if (allDepsSatisfied) {
        currentPhase.push(storyId);
      }
    }

    if (currentPhase.length === 0) break;

    currentPhase.forEach(id => {
      remaining.delete(id);
      processed.add(id);
    });

    const duration = currentPhase.reduce((sum, id) => {
      const dep = dependencies.find(d => d.storyId === id);
      return sum + (dep?.timing?.duration || 2);
    }, 0);

    phases.push({
      phaseNum,
      name: `Phase ${phaseNum}`,
      stories: currentPhase,
      duration,
      successCriteria: ['All stories pass validation', 'Assets meet brand guidelines']
    });

    phaseNum++;
  }

  return {
    originalOrder: prd.userStories.map(s => s.id),
    optimizedOrder,
    phases,
    criticalPath,
    parallelizable: phases.map(p => p.stories),
    riskMitigations: [
      `Critical path: ${criticalPath.join(' → ')} (${criticalPath.length} stories)`,
      `Can run ${Math.max(...phases.map(p => p.stories.length))} stories in parallel`,
      'Schedule phase reviews between phases for quality gates'
    ]
  };
}

/**
 * Get sequencing insights
 */
export function getSequencingInsights(plan: SequencedPlan) {
  const totalPhases = plan.phases.length;
  const longestPhase = Math.max(...plan.phases.map(p => p.duration));
  const parallelCapacity = plan.parallelizable.map(p => p.length);
  const maxParallel = Math.max(...parallelCapacity);

  return {
    totalPhases,
    criticalPathLength: plan.criticalPath.length,
    maxParallelStories: maxParallel,
    estimatedDuration: plan.phases.reduce((sum, p) => sum + p.duration, 0),
    efficiencyGain: `${Math.round((1 - plan.criticalPath.length / plan.originalOrder.length) * 100)}% faster than sequential`,
    recommendation: `Execute in ${totalPhases} phases. Phase bottleneck: ${longestPhase} hours.`
  };
}
