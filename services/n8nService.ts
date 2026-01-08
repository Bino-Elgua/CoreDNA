import { BrandDNA, LeadProfile, CampaignAsset, SavedCampaign } from '../types';
import { workflowProviderManager } from './workflowProvider';

export interface WorkflowExecutionRequest {
    workflowId: string;
    name: string;
    input: Record<string, any>;
    timeout?: number;
}

export interface WorkflowExecutionResponse {
    executionId: string;
    status: 'success' | 'pending' | 'error';
    result?: any;
    error?: string;
    duration: number;
}

export interface WorkflowHealth {
    status: 'healthy' | 'degraded' | 'offline';
    uptime: number;
    lastCheck: number;
    version?: string;
}

/**
 * n8n Workflow Service
 * Integrates n8n as the automation backbone for Core DNA
 * Handles lead generation, closer agent, campaign generation, scheduling, and website building
 * 
 * All user-facing workflows run silently via this service.
 * Advanced users (Hunter tier) can optionally view/edit workflows via the Automations panel.
 */
class N8nWorkflowService {
    private baseUrl: string;
    private apiKey: string;
    private isHealthy = true;
    private lastHealthCheck = Date.now();

    constructor() {
        // Read from environment or config
        this.baseUrl = import.meta.env.VITE_N8N_API_URL || 'http://localhost:5678/api/v1';
        this.apiKey = import.meta.env.VITE_N8N_API_KEY || 'internal';
    }

    /**
     * Health check for n8n backend
     */
    async checkHealth(): Promise<WorkflowHealth> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'X-N8N-API-KEY': this.apiKey },
            });

            if (response.ok) {
                this.isHealthy = true;
                this.lastHealthCheck = Date.now();
                return {
                    status: 'healthy',
                    uptime: Date.now() - this.lastHealthCheck,
                    lastCheck: this.lastHealthCheck,
                };
            }

            this.isHealthy = false;
            return {
                status: 'degraded',
                uptime: 0,
                lastCheck: this.lastHealthCheck,
            };
        } catch (error) {
            this.isHealthy = false;
            return {
                status: 'offline',
                uptime: 0,
                lastCheck: this.lastHealthCheck,
            };
        }
    }

    /**
     * Execute a workflow and wait for result
     */
    async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> {
        if (!this.isHealthy) {
            throw new Error('n8n service is not available. Falling back to standard mode.');
        }

        try {
            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/workflows/${request.workflowId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-N8N-API-KEY': this.apiKey,
                },
                body: JSON.stringify({
                    name: request.name,
                    data: request.input,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    executionId: 'error',
                    status: 'error',
                    error: error.message || 'Workflow execution failed',
                    duration: Date.now() - startTime,
                };
            }

            const result = await response.json();
            return {
                executionId: result.executionId,
                status: 'success',
                result: result.data,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                executionId: 'error',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: 0,
            };
        }
    }

    /**
     * Lead Generation Workflow
     * Scrapes niche/location → Quick DNA scan → Filter by consistency → Output leads
     */
    async runLeadGeneration(niche: string, latitude: number, longitude: number): Promise<LeadProfile[]> {
        const response = await this.executeWorkflow({
            workflowId: 'lead-generation',
            name: 'Lead Generation',
            input: {
                niche,
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
            },
            timeout: 60000,
        });

        if (response.status === 'error') {
            console.warn('Lead generation workflow failed, falling back to standard mode');
            return [];
        }

        return response.result?.leads || [];
    }

    /**
     * Closer Swarm Workflow
     * Researcher → Writer → Closer → Send email package
     */
    async runCloserAgent(lead: LeadProfile, dna: BrandDNA | undefined): Promise<any> {
        const response = await this.executeWorkflow({
            workflowId: 'closer-swarm',
            name: 'Closer Agent',
            input: {
                lead,
                dna,
                timestamp: new Date().toISOString(),
            },
            timeout: 45000,
        });

        if (response.status === 'error') {
            console.warn('Closer workflow failed, falling back to standard mode');
            return null;
        }

        return response.result?.portfolio || null;
    }

    /**
     * Campaign Generation Workflow
     * DNA → Prompt LLM → Generate posts/banners/emails → Images → Package
     */
    async runCampaignGeneration(dna: BrandDNA, goal: string): Promise<CampaignAsset[]> {
        const response = await this.executeWorkflow({
            workflowId: 'campaign-generation',
            name: 'Campaign Generation',
            input: {
                dna,
                goal,
                timestamp: new Date().toISOString(),
            },
            timeout: 90000,
        });

        if (response.status === 'error') {
            console.warn('Campaign generation workflow failed, falling back to standard mode');
            return [];
        }

        return response.result?.assets || [];
    }

    /**
     * Auto-Post Scheduler Workflow
     * Pull posts → Auth Meta/Twitter → Post to platforms → Log status
     */
    async scheduleAutoPosts(campaign: SavedCampaign, schedule: { day: string; time: string }): Promise<{ status: string; scheduledAt: string }> {
        const response = await this.executeWorkflow({
            workflowId: 'auto-post-scheduler',
            name: 'Auto-Post Scheduler',
            input: {
                campaign,
                schedule,
                timestamp: new Date().toISOString(),
            },
            timeout: 30000,
        });

        if (response.status === 'error') {
            console.warn('Scheduler workflow failed');
            return { status: 'error', scheduledAt: new Date().toISOString() };
        }

        return {
            status: 'scheduled',
            scheduledAt: response.result?.scheduledAt || new Date().toISOString(),
        };
    }

    /**
     * Website Build Workflow (Bonus)
     * Pass DNA → Firebase Studio vibe → Deploy → Return live URL
     */
    async buildWebsite(dna: BrandDNA): Promise<{ url: string; status: string; buildTime: number }> {
        const response = await this.executeWorkflow({
            workflowId: 'website-build',
            name: 'Website Builder',
            input: {
                dna,
                timestamp: new Date().toISOString(),
            },
            timeout: 120000,
        });

        if (response.status === 'error') {
            console.warn('Website build workflow failed');
            return { url: '', status: 'error', buildTime: 0 };
        }

        return {
            url: response.result?.deployedUrl || '',
            status: 'deployed',
            buildTime: response.duration,
        };
    }

    /**
     * Get all available workflows (for Hunter tier advanced users)
     */
    async listWorkflows(): Promise<Array<{ id: string; name: string; description: string; active: boolean }>> {
        try {
            const response = await fetch(`${this.baseUrl}/workflows`, {
                method: 'GET',
                headers: { 'X-N8N-API-KEY': this.apiKey },
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to list workflows:', error);
            return [];
        }
    }

    /**
     * Get workflow definition (for Hunter tier editing)
     */
    async getWorkflow(workflowId: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
                method: 'GET',
                headers: { 'X-N8N-API-KEY': this.apiKey },
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to get workflow ${workflowId}:`, error);
            return null;
        }
    }

    /**
     * Get n8n UI embed URL (for Automations panel)
     */
    getEmbedUrl(): string {
        return `${this.baseUrl.replace('/api/v1', '')}/edit`;
    }

    /**
     * Check if n8n is available (perform fresh health check)
     */
    async isAvailable(): Promise<boolean> {
        const health = await this.checkHealth();
        return health.status === 'healthy';
    }

    /**
     * Use configured workflow provider (n8n, Make, Zapier, or custom)
     */
    getProvider() {
        return workflowProviderManager.getProvider();
    }
}

export default new N8nWorkflowService();
