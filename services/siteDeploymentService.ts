/**
 * Site Deployment Orchestration Service
 * Coordinates GitHub, Vercel, and AMP CLI
 */

import { BrandDNA } from '../types';
import { GitHubService } from './githubService';
import { VercelService } from './vercelService';
import { ampCLIService } from './ampCLIService';

export interface DeploymentConfig {
  companyName: string;
  portfolio: BrandDNA;
  githubToken: string;
  githubOwner: string;
  vercelToken: string;
  vercelTeamId?: string;
  useLocalGeneration?: boolean;
}

export interface DeploymentProgress {
  stage: 'generating' | 'github' | 'vercel' | 'complete' | 'error';
  message: string;
  progress: number;
  data?: any;
}

export class SiteDeploymentService {
  private progressCallbacks: ((progress: DeploymentProgress) => void)[] = [];

  /**
   * Subscribe to deployment progress updates
   */
  onProgress(callback: (progress: DeploymentProgress) => void) {
    this.progressCallbacks.push(callback);
  }

  /**
   * Emit progress update
   */
  private emitProgress(progress: DeploymentProgress) {
    console.log(`[Deployment] ${progress.stage}: ${progress.message}`);
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * Full deployment workflow
   */
  async deploy(config: DeploymentConfig): Promise<{
    success: boolean;
    repoUrl: string;
    deploymentUrl: string;
    message: string;
  }> {
    try {
      const repoName = config.companyName.toLowerCase().replace(/\s+/g, '-');

      // STEP 1: Generate website
      this.emitProgress({
        stage: 'generating',
        message: 'Generating website with AMP CLI...',
        progress: 10
      });

      const generated = config.useLocalGeneration
        ? await ampCLIService.generateWebsiteLocal({
            portfolio: config.portfolio,
            company: config.companyName
          })
        : await ampCLIService.generateWebsite({
            portfolio: config.portfolio,
            company: config.companyName,
            template: 'portfolio'
          });

      if (!generated.success) {
        throw new Error('Website generation failed');
      }

      this.emitProgress({
        stage: 'generating',
        message: `Generated ${Object.keys(generated.files).length} files`,
        progress: 30,
        data: generated
      });

      // STEP 2: Create GitHub repo & push files
      this.emitProgress({
        stage: 'github',
        message: 'Creating GitHub repository...',
        progress: 40
      });

      const github = new GitHubService({
        token: config.githubToken,
        owner: config.githubOwner
      });

      const repo = await github.createRepository(
        repoName,
        `${config.companyName} - ${config.portfolio.tagline}`
      );

      this.emitProgress({
        stage: 'github',
        message: 'Pushing files to GitHub...',
        progress: 60,
        data: { repoUrl: repo.html_url }
      });

      await github.uploadFiles(repoName, generated.files, `feat: Generate ${config.companyName} website`);

      this.emitProgress({
        stage: 'github',
        message: 'GitHub repo ready',
        progress: 70,
        data: { repoUrl: repo.html_url }
      });

      // STEP 3: Deploy to Vercel
      this.emitProgress({
        stage: 'vercel',
        message: 'Creating Vercel project...',
        progress: 75
      });

      const vercel = new VercelService({
        token: config.vercelToken,
        teamId: config.vercelTeamId
      });

      const project = await vercel.createProject(
        repoName,
        repo.html_url,
        config.githubOwner,
        repoName
      );

      this.emitProgress({
        stage: 'vercel',
        message: 'Deploying to production...',
        progress: 85,
        data: { projectId: project.projectId }
      });

      // Wait a bit for Vercel to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      const deployment = await vercel.deployProduction(project.projectId);

      this.emitProgress({
        stage: 'vercel',
        message: 'Deployment in progress...',
        progress: 95,
        data: { deploymentUrl: deployment.url, projectId: project.projectId }
      });

      // STEP 4: Complete
      this.emitProgress({
        stage: 'complete',
        message: `✓ Website deployed successfully!`,
        progress: 100,
        data: {
          repoUrl: repo.html_url,
          deploymentUrl: `https://${deployment.url}`,
          projectId: project.projectId
        }
      });

      return {
        success: true,
        repoUrl: repo.html_url,
        deploymentUrl: `https://${deployment.url}`,
        message: `Website deployed to ${deployment.url}`
      };
    } catch (error) {
      console.error('[Deployment] Error:', error);
      this.emitProgress({
        stage: 'error',
        message: `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        progress: 0
      });

      throw error;
    }
  }
}

export const siteDeploymentService = new SiteDeploymentService();
