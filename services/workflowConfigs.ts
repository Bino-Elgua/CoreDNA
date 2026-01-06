/**
 * n8n Workflow Configurations
 * These workflows must be pre-created in n8n and deployed
 */

export const WORKFLOW_CONFIGS = {
    leadGeneration: {
        id: 'lead-generation',
        name: 'Lead Generation',
        description: 'Scrape niche/location → Quick DNA scan → Filter by consistency → Output leads',
        icon: '🎯',
        tier: 'pro',
        trigger: 'manual',
        inputs: ['niche', 'latitude', 'longitude'],
        outputs: ['leads'],
        nodes: [
            {
                name: 'Webhook Trigger',
                type: 'n8n-nodes-base.webhook',
                config: { httpMethod: 'POST', path: 'lead-gen' },
            },
            {
                name: 'Google Maps Scraper',
                type: 'n8n-nodes-base.httpRequest',
                config: { url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json' },
            },
            {
                name: 'Quick DNA Scan',
                type: 'n8n-nodes-base.code',
                config: { language: 'javascript', code: 'Extract brand signals from lead' },
            },
            {
                name: 'Filter by Consistency',
                type: 'n8n-nodes-base.itemLists',
                config: { operation: 'filter', comparator: '>= 0.7' },
            },
            {
                name: 'Return Results',
                type: 'n8n-nodes-base.respondToWebhook',
                config: { responseCode: 200 },
            },
        ],
    },

    closerSwarm: {
        id: 'closer-swarm',
        name: 'Closer Agent Swarm',
        description: 'Researcher → Writer → Closer → Send email outreach',
        icon: '📧',
        tier: 'pro',
        trigger: 'manual',
        inputs: ['lead', 'dna'],
        outputs: ['portfolio', 'emailStatus'],
        nodes: [
            {
                name: 'Webhook Trigger',
                type: 'n8n-nodes-base.webhook',
                config: { httpMethod: 'POST', path: 'closer-swarm' },
            },
            {
                name: 'Researcher (Mini DNA Extract)',
                type: 'n8n-nodes-base.httpRequest',
                config: { method: 'POST', url: 'internal:research' },
            },
            {
                name: 'Writer (Draft Report Email)',
                type: 'n8n-nodes-base.httpRequest',
                config: { method: 'POST', url: 'internal:write' },
            },
            {
                name: 'Closer (Add Urgency & Pricing)',
                type: 'n8n-nodes-base.httpRequest',
                config: { method: 'POST', url: 'internal:close' },
            },
            {
                name: 'Send Email (Resend/Gmail)',
                type: 'n8n-nodes-base.emailSend',
                config: { fromEmail: 'noreply@coredna.ai', transport: 'resend' },
            },
            {
                name: 'Return Results',
                type: 'n8n-nodes-base.respondToWebhook',
                config: { responseCode: 200 },
            },
        ],
    },

    campaignGeneration: {
        id: 'campaign-generation',
        name: 'Campaign Generation',
        description: 'DNA → Prompt LLM → Generate posts/banners/emails → Images → Package',
        icon: '🎨',
        tier: 'pro',
        trigger: 'manual',
        inputs: ['dna', 'goal'],
        outputs: ['assets'],
        nodes: [
            {
                name: 'Webhook Trigger',
                type: 'n8n-nodes-base.webhook',
                config: { httpMethod: 'POST', path: 'campaign-gen' },
            },
            {
                name: 'LLM Prompt (Content Generation)',
                type: 'n8n-nodes-base.openAi',
                config: { operation: 'message', model: 'gpt-4' },
            },
            {
                name: 'Image Generation (Flux/Ideogram)',
                type: 'n8n-nodes-base.httpRequest',
                config: { method: 'POST', url: 'https://api.fal.ai/v1/flux-pro' },
            },
            {
                name: 'Package Assets',
                type: 'n8n-nodes-base.code',
                config: { language: 'javascript', code: 'Organize into CampaignAsset[]' },
            },
            {
                name: 'Return Results',
                type: 'n8n-nodes-base.respondToWebhook',
                config: { responseCode: 200 },
            },
        ],
    },

    autoPostScheduler: {
        id: 'auto-post-scheduler',
        name: 'Auto-Post Scheduler',
        description: 'Pull posts → Auth Meta/Twitter → Post to platforms → Log status',
        icon: '📱',
        tier: 'hunter',
        trigger: 'schedule',
        inputs: ['campaign', 'schedule'],
        outputs: ['postStatus'],
        nodes: [
            {
                name: 'Schedule Trigger',
                type: 'n8n-nodes-base.scheduleTrigger',
                config: { unit: 'day', value: 1 },
            },
            {
                name: 'Fetch Campaign Posts',
                type: 'n8n-nodes-base.code',
                config: { language: 'javascript', code: 'Pull posts from campaign' },
            },
            {
                name: 'Authenticate Meta',
                type: 'n8n-nodes-base.oauth2',
                config: { credentialType: 'facebook' },
            },
            {
                name: 'Authenticate Twitter',
                type: 'n8n-nodes-base.oauth2',
                config: { credentialType: 'twitter' },
            },
            {
                name: 'Post to Facebook',
                type: 'n8n-nodes-base.facebook',
                config: { operation: 'post' },
            },
            {
                name: 'Post to Twitter',
                type: 'n8n-nodes-base.twitter',
                config: { operation: 'tweet' },
            },
            {
                name: 'Log Status',
                type: 'n8n-nodes-base.spreadsheet',
                config: { operation: 'append', range: 'PostLog' },
            },
        ],
    },

    websiteBuild: {
        id: 'website-build',
        name: 'Website Builder',
        description: 'Pass DNA → Firebase Studio vibe → Deploy → Return live URL',
        icon: '🌐',
        tier: 'hunter',
        trigger: 'manual',
        inputs: ['dna'],
        outputs: ['deployedUrl', 'buildTime'],
        nodes: [
            {
                name: 'Webhook Trigger',
                type: 'n8n-nodes-base.webhook',
                config: { httpMethod: 'POST', path: 'website-build' },
            },
            {
                name: 'Generate Site Structure',
                type: 'n8n-nodes-base.code',
                config: { language: 'javascript', code: 'Build HTML/CSS from DNA' },
            },
            {
                name: 'Firebase Deploy',
                type: 'n8n-nodes-base.google',
                config: { resource: 'firebase', operation: 'deploy' },
            },
            {
                name: 'Return Live URL',
                type: 'n8n-nodes-base.respondToWebhook',
                config: { responseCode: 200 },
            },
        ],
    },
};

export const getWorkflowById = (id: string) => {
    return Object.values(WORKFLOW_CONFIGS).find(w => w.id === id);
};

export const getWorkflowsByTier = (tier: 'pro' | 'hunter') => {
    return Object.values(WORKFLOW_CONFIGS).filter(w => w.tier === tier || w.tier === 'pro');
};

export const getAllWorkflows = () => Object.values(WORKFLOW_CONFIGS);
