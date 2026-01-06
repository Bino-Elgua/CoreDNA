
import { GlobalSettings, CampaignAsset, BrandDNA, WorkflowProviderId } from '../types';

const getSettings = (): GlobalSettings => {
    const stored = localStorage.getItem('core_dna_settings');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) { console.error("Error reading settings", e); }
    }
    return { workflows: {} } as any;
};

export interface WorkflowProvider {
    id: WorkflowProviderId;
    name: string;
    enabled: boolean;
}

export const getEnabledWorkflows = (): WorkflowProvider[] => {
    const settings = getSettings();
    if (!settings.workflows) return [];
    
    // Explicitly map all known providers to ensure order and existence
    const potentialProviders: {id: WorkflowProviderId, name: string}[] = [
        { id: 'n8n', name: 'n8n Automation' },
        { id: 'zapier', name: 'Zapier' },
        { id: 'make', name: 'Make.com' },
        { id: 'activepieces', name: 'ActivePieces' },
        { id: 'pipedream', name: 'Pipedream' },
        { id: 'relay', name: 'Relay.app' },
        { id: 'integrately', name: 'Integrately' },
        { id: 'pabbly', name: 'Pabbly Connect' },
        { id: 'tray', name: 'Tray.io' },
        { id: 'dify', name: 'Dify.ai' },
        { id: 'custom_rag', name: 'Custom Webhook' },
    ];

    return potentialProviders.map(p => ({
        ...p,
        enabled: settings.workflows[p.id]?.enabled || false
    })).filter(p => p.enabled);
};

export const triggerScheduleWorkflow = async (
    providerKey: string, 
    campaignData: { 
        dna: BrandDNA, 
        goal: string, 
        assets: CampaignAsset[] 
    }
) => {
    const settings = getSettings();
    const config = settings.workflows[providerKey];
    
    if (!config || !config.enabled) throw new Error("Workflow provider not enabled");

    // Prefer specific schedule URL, fallback to generic
    const url = config.scheduleWebhookUrl || config.webhookUrl;
    if (!url) throw new Error("No webhook URL configured for this provider in Settings.");

    // Filter out heavy base64 images if the provider might choke, 
    // OR ensure the receiving end can handle it. 
    // For now, we send it all but stripped of some metadata to keep it clean.
    
    const payload = {
        timestamp: new Date().toISOString(),
        provider: providerKey,
        campaign: {
            profileId: campaignData.dna.id,
            brandName: campaignData.dna.name,
            goal: campaignData.goal,
            assets: campaignData.assets.map(a => ({
                title: a.title,
                channel: a.channel,
                content: a.content,
                imagePrompt: a.imagePrompt,
                scheduledAt: a.scheduledAt || new Date().toISOString(),
                // We send the image data. Warning: Large payloads.
                imageUrl: a.imageUrl ? a.imageUrl : null 
            }))
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Workflow Error: ${response.status} ${response.statusText}`);
        }
        return true;
    } catch (e) {
        console.error("Workflow trigger failed", e);
        throw e;
    }
}
