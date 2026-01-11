/**
 * GitHub Integration Service
 * Handles repo creation, file pushing, and branch management
 */

interface GitHubAuthConfig {
  token: string;
  owner: string;
}

export class GitHubService {
  private token: string = '';
  private owner: string = '';
  private apiBase = 'https://api.github.com';

  constructor(config: GitHubAuthConfig) {
    this.token = config.token;
    this.owner = config.owner;
  }

  /**
   * Create a new GitHub repository
   */
  async createRepository(name: string, description: string): Promise<any> {
    try {
      console.log(`[GitHub] Creating repo: ${name}`);
      
      const response = await fetch(`${this.apiBase}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name,
          description,
          private: false,
          auto_init: true,
          gitignore_template: 'Node'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create repo: ${error.message}`);
      }

      const repo = await response.json();
      console.log(`[GitHub] ✓ Repo created: ${repo.html_url}`);
      return repo;
    } catch (error) {
      console.error('[GitHub] Error creating repo:', error);
      throw error;
    }
  }

  /**
   * Upload files to GitHub repo
   */
  async uploadFiles(
    repoName: string,
    files: Record<string, string>,
    message: string = 'Initial commit: Generated website'
  ): Promise<any> {
    try {
      console.log(`[GitHub] Uploading ${Object.keys(files).length} files to ${repoName}`);

      // Get latest commit SHA
      const refResponse = await fetch(
        `${this.apiBase}/repos/${this.owner}/${repoName}/git/refs/heads/main`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const ref = await refResponse.json();
      let latestSha = ref.object.sha;

      // Get commit object
      const commitResponse = await fetch(
        `${this.apiBase}/repos/${this.owner}/${repoName}/git/commits/${latestSha}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const commit = await commitResponse.json();
      let treeData: any = {
        base_tree: commit.tree.sha,
        tree: []
      };

      // Create tree entries for each file
      for (const [path, content] of Object.entries(files)) {
        treeData.tree.push({
          path,
          mode: '100644',
          type: 'blob',
          content
        });
      }

      // Create tree
      const treeResponse = await fetch(
        `${this.apiBase}/repos/${this.owner}/${repoName}/git/trees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(treeData)
        }
      );

      const tree = await treeResponse.json();

      // Create commit
      const newCommitResponse = await fetch(
        `${this.apiBase}/repos/${this.owner}/${repoName}/git/commits`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message,
            tree: tree.sha,
            parents: [latestSha]
          })
        }
      );

      const newCommit = await newCommitResponse.json();

      // Update ref
      const updateResponse = await fetch(
        `${this.apiBase}/repos/${this.owner}/${repoName}/git/refs/heads/main`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            sha: newCommit.sha
          })
        }
      );

      console.log(`[GitHub] ✓ Files uploaded successfully`);
      return await updateResponse.json();
    } catch (error) {
      console.error('[GitHub] Error uploading files:', error);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(repoName: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${repoName}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) throw new Error('Repo not found');
      return await response.json();
    } catch (error) {
      console.error('[GitHub] Error getting repo:', error);
      throw error;
    }
  }
}

export const createGitHubService = (token: string, owner: string) => {
  return new GitHubService({ token, owner });
};
