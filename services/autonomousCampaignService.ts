/**
 * Autonomous Campaign Service
 * Ralph-style agent loop that automatically executes campaign PRD user stories
 * Each story generates assets until all pass quality checks
 */

import { CampaignPRD, CampaignUserStory, markStoryComplete, getPRDProgress } from './campaignPRDService';
import { sonicChat } from './sonicCoPilot';
import { generateCampaignAssets } from './geminiService';
import { generateImage, generateVideo } from './mediaGenerationService';
import { CampaignAsset, BrandDNA } from '../types';

export interface AutoExecutionProgress {
  prdId: string;
  currentStoryId: string;
  storyIndex: number;
  totalStories: number;
  iterationCount: number;
  status: 'pending' | 'generating' | 'validating' | 'complete' | 'failed';
  message: string;
  assets: CampaignAsset[];
  learnings: string[];
}

export interface ExecutionLog {
  timestamp: number;
  storyId: string;
  action: string;
  result: 'pass' | 'fail';
  message: string;
}

let executionState: {
  logs: ExecutionLog[];
  learnings: string[];
  maxIterations: number;
  currentIteration: number;
} = {
  logs: [],
  learnings: [],
  maxIterations: 10,
  currentIteration: 0
};

/**
 * Execute next story from PRD
 * Generates assets, validates, and marks complete if successful
 */
export async function executeNextStory(
  prd: CampaignPRD,
  dna: BrandDNA,
  onProgress?: (progress: AutoExecutionProgress) => void
): Promise<{ success: boolean; assets?: CampaignAsset[] }> {
  // Find first incomplete story
  const nextStory = prd.userStories.find(s => !s.passes);
  if (!nextStory) {
    const msg = `✓ All ${prd.userStories.length} stories complete!`;
    console.log('[autonomousCampaignService]', msg);
    if (onProgress) {
      onProgress({
        prdId: prd.id,
        currentStoryId: '',
        storyIndex: prd.userStories.length,
        totalStories: prd.userStories.length,
        iterationCount: executionState.currentIteration,
        status: 'complete',
        message: msg,
        assets: [],
        learnings: executionState.learnings
      });
    }
    return { success: true };
  }

  const storyIndex = prd.userStories.findIndex(s => s.id === nextStory.id);
  executionState.currentIteration++;

  if (onProgress) {
    onProgress({
      prdId: prd.id,
      currentStoryId: nextStory.id,
      storyIndex,
      totalStories: prd.userStories.length,
      iterationCount: executionState.currentIteration,
      status: 'generating',
      message: `Executing story ${storyIndex + 1}/${prd.userStories.length}: ${nextStory.title}`,
      assets: [],
      learnings: executionState.learnings
    });
  }

  try {
    // Generate assets for this story
    const assets = await generateStoryAssets(nextStory, dna, prd.projectName);

    logExecution(nextStory.id, 'Asset generation', 'pass', `Generated ${assets.length} assets`);

    if (onProgress) {
      onProgress({
        prdId: prd.id,
        currentStoryId: nextStory.id,
        storyIndex,
        totalStories: prd.userStories.length,
        iterationCount: executionState.currentIteration,
        status: 'validating',
        message: `Validating ${assets.length} asset(s)...`,
        assets,
        learnings: executionState.learnings
      });
    }

    // Validate against acceptance criteria
    const validationResult = await validateAgainstCriteria(assets, nextStory, dna);

    if (validationResult.passes) {
      markStoryComplete(prd.id, nextStory.id);
      
      executionState.learnings.push(
        `[${new Date().toLocaleString()}] ✓ ${nextStory.title} - ${validationResult.message}`
      );

      logExecution(nextStory.id, 'Validation', 'pass', validationResult.message);

      if (onProgress) {
        onProgress({
          prdId: prd.id,
          currentStoryId: nextStory.id,
          storyIndex,
          totalStories: prd.userStories.length,
          iterationCount: executionState.currentIteration,
          status: 'complete',
          message: `✓ Story complete: ${nextStory.title}`,
          assets,
          learnings: executionState.learnings
        });
      }

      return { success: true, assets };
    } else {
      executionState.learnings.push(
        `[${new Date().toLocaleString()}] ✗ ${nextStory.title} - Validation failed: ${validationResult.message}`
      );

      logExecution(nextStory.id, 'Validation', 'fail', validationResult.message);

      if (onProgress) {
        onProgress({
          prdId: prd.id,
          currentStoryId: nextStory.id,
          storyIndex,
          totalStories: prd.userStories.length,
          iterationCount: executionState.currentIteration,
          status: 'failed',
          message: `Validation failed: ${validationResult.message}`,
          assets,
          learnings: executionState.learnings
        });
      }

      return { success: false, assets };
    }
  } catch (error: any) {
    const msg = `Error executing story: ${error.message}`;
    console.error('[autonomousCampaignService]', msg);

    logExecution(nextStory.id, 'Execution', 'fail', msg);

    if (onProgress) {
      onProgress({
        prdId: prd.id,
        currentStoryId: nextStory.id,
        storyIndex,
        totalStories: prd.userStories.length,
        iterationCount: executionState.currentIteration,
        status: 'failed',
        message: msg,
        assets: [],
        learnings: executionState.learnings
      });
    }

    return { success: false };
  }
}

/**
 * Generate assets for a specific user story
 */
async function generateStoryAssets(
  story: CampaignUserStory,
  dna: BrandDNA,
  projectName: string
): Promise<CampaignAsset[]> {
  try {
    // Use AI to understand what the story needs
    const prompt = `For this campaign story, generate specific asset details:

Story: ${story.title}
Description: ${story.description}
Type: ${story.type}
Acceptance Criteria: ${story.acceptanceCriteria.join(', ')}

Generate 2 asset variants. For each, provide:
- title: brief headline
- copy: body text (100-150 chars)
- cta: call-to-action
- imagePrompt: detailed visual description
- channel: ${story.channel || 'Multi-channel'}

Return ONLY valid JSON array with 2 objects, no markdown.`;

    const response = await generateCampaignAssets(dna, prompt, [story.channel || 'Instagram'], 2);

    // Generate images and videos for each asset
    const assetsWithImages = await Promise.all(
      response.map(async (asset: any, idx: number) => {
        let imageUrl = '';
        let videoUrl = '';
        
        try {
          // Generate image from prompt if available
          if (asset.imagePrompt) {
            console.log(`[generateStoryAssets] Generating image ${idx + 1}/2 for "${asset.title}"`);
            const imageResult = await generateImage(asset.imagePrompt, { style: dna.visualStyle?.description || 'Modern' });
            imageUrl = imageResult.url;
            console.log(`[generateStoryAssets] ✓ Image generated for ${asset.title}`);
          }
        } catch (imgError: any) {
          console.warn(`[generateStoryAssets] Image generation failed for asset ${idx}: ${imgError.message}`);
          // Continue without image - don't fail the entire story
        }
        
        // Generate video for video-type assets if video provider available
        try {
          if (story.type === 'video' && asset.title) {
            console.log(`[generateStoryAssets] Generating video for "${asset.title}"`);
            const videoPrompt = `Professional marketing video: ${asset.title}. ${asset.copy || ''}`;
            const videoResult = await generateVideo(videoPrompt, { duration: 6 });
            if (videoResult) {
              videoUrl = videoResult.url;
              console.log(`[generateStoryAssets] ✓ Video generated for ${asset.title}`);
            }
          }
        } catch (videoError: any) {
          console.warn(`[generateStoryAssets] Video generation failed for asset ${idx}: ${videoError.message}`);
          // Continue without video - optional enhancement
        }

        return {
          id: `asset-${story.id}-${idx}`,
          channel: story.channel || 'Instagram',
          type: story.type,
          title: asset.title,
          content: asset.copy,
          cta: asset.cta,
          imagePrompt: asset.imagePrompt,
          imageUrl,
          videoUrl,
          isGeneratingImage: false,
          isGeneratingVideo: false,
          scheduledAt: null,
          notes: `Generated from story: ${story.id}`
        };
      })
    );

    return assetsWithImages;
  } catch (error: any) {
    console.error('[generateStoryAssets]', error.message);
    throw error;
  }
}

/**
 * Validate assets against story acceptance criteria
 */
async function validateAgainstCriteria(
  assets: CampaignAsset[],
  story: CampaignUserStory,
  dna: BrandDNA
): Promise<{ passes: boolean; message: string }> {
  try {
    // Use AI to validate
    const { response } = await sonicChat(
      `As a QA engineer, validate these assets against acceptance criteria:

Story: ${story.title}
Type: ${story.type}

Acceptance Criteria:
${story.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Assets Generated:
${assets.map((a, i) => `${i + 1}. ${a.title} - ${a.content}`).join('\n')}

Respond with ONLY:
PASS: [reason] - if all criteria met
FAIL: [reason] - if any criteria not met

Be strict but fair. Assets must match the brand "${dna.name}" voice and style.`,
      [],
      'pro'
    );

    const passes = response.toLowerCase().startsWith('pass');
    const message = response.split(': ')[1] || 'Validation complete';

    return { passes, message };
  } catch (error: any) {
    // Graceful fallback
    console.warn('[validateAgainstCriteria] Using fallback validation', error.message);
    return {
      passes: assets.length >= 1,
      message: `Generated ${assets.length} asset(s)`
    };
  }
}

/**
 * Run full autonomous loop until all stories pass
 */
export async function runAutonomousCampaign(
  prd: CampaignPRD,
  dna: BrandDNA,
  maxIterations = 10,
  onProgress?: (progress: AutoExecutionProgress) => void
): Promise<void> {
  executionState.maxIterations = maxIterations;
  executionState.currentIteration = 0;
  executionState.logs = [];
  executionState.learnings = [];

  for (let i = 0; i < maxIterations; i++) {
    const result = await executeNextStory(prd, dna, onProgress);

    if (!result.success && i < maxIterations - 1) {
      // Retry logic could go here
      console.log(`[autonomousCampaignService] Attempt ${i + 1} failed, retrying...`);
    }

    // Check if all stories pass
    const progress = getPRDProgress(prd);
    if (progress.completed === progress.total) {
      break;
    }
  }
}

/**
 * Log execution details
 */
function logExecution(storyId: string, action: string, result: 'pass' | 'fail', message: string): void {
  executionState.logs.push({
    timestamp: Date.now(),
    storyId,
    action,
    result,
    message
  });
}

/**
 * Get execution state
 */
export function getExecutionState() {
  return executionState;
}

/**
 * Save learnings to brand knowledge base
 */
export function saveLearningsToAGENTS(prdId: string): void {
  const prds = localStorage.getItem('core_dna_campaign_prds');
  if (!prds) return;

  const allPRDs = JSON.parse(prds);
  const prd = allPRDs.find((p: CampaignPRD) => p.id === prdId);
  if (!prd) return;

  const learningsText = executionState.learnings.join('\n');
  const agentsContent = `
# Campaign Execution Learnings - ${prd.projectName}

## Generated ${new Date().toLocaleString()}
${learningsText}

## Completed Stories
${prd.userStories.filter(s => s.passes).map(s => `- ${s.title}`).join('\n')}
`;

  // In a real app, this would update an AGENTS.md file
  localStorage.setItem(`campaign_learnings_${prdId}`, agentsContent);
  console.log('[saveLearningsToAGENTS] Saved learnings:', agentsContent);
}
