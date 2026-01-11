/**
 * Vercel Integration Service
 * Handles project creation and deployment
 */

interface VercelAuthConfig {
  token: string;
  teamId?: string;
}

export class VercelService {
  private token: string = '';
  private teamId: string = '';
  private apiBase = 'https://api.vercel.com';

  constructor(config: VercelAuthConfig) {
    this.token = config.token;
    this.teamId = config.teamId || '';
  }

  /**
   * Create a new Vercel project from GitHub repo
   */
  async createProject(
    projectName: string,
    gitRepoUrl: string,
    gitOwner: string,
    gitRepo: string
  ): Promise<any> {
    try {
      console.log(`[Vercel] Creating project: ${projectName}`);

      const body: any = {
        name: projectName,
        gitRepository: {
          type: 'github',
          repo: `${gitOwner}/${gitRepo}`,
          url: gitRepoUrl
        },
        framework: 'nextjs',
        buildCommand: 'npm run build',
        installCommand: 'npm install',
        outputDirectory: 'dist'
      };

      if (this.teamId) {
        body.teamId = this.teamId;
      }

      const response = await fetch(`${this.apiBase}/v10/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create project: ${error.message}`);
      }

      const project = await response.json();
      console.log(`[Vercel] ✓ Project created: ${project.projectId}`);
      return project;
    } catch (error) {
      console.error('[Vercel] Error creating project:', error);
      throw error;
    }
  }

  /**
   * Deploy to production
   */
  async deployProduction(projectId: string): Promise<any> {
    try {
      console.log(`[Vercel] Deploying project: ${projectId}`);

      const response = await fetch(
        `${this.apiBase}/v13/deployments?projectId=${projectId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'production-deployment',
            production: true
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to deploy: ${error.message}`);
      }

      const deployment = await response.json();
      console.log(`[Vercel] ✓ Deployed: ${deployment.url}`);
      return deployment;
    } catch (error) {
      console.error('[Vercel] Error deploying:', error);
      throw error;
    }
  }

  /**
   * Get project status
   */
  async getProject(projectId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/v9/projects/${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) throw new Error('Project not found');
      return await response.json();
    } catch (error) {
      console.error('[Vercel] Error getting project:', error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/v13/deployments/${deploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) throw new Error('Deployment not found');
      return await response.json();
    } catch (error) {
      console.error('[Vercel] Error getting deployment:', error);
      throw error;
    }
  }
}

export const createVercelService = (token: string, teamId?: string) => {
  return new VercelService({ token, teamId });
};
