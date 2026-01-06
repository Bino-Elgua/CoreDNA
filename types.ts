
export interface SamplePost {
    platform: string;
    content: string;
    imageUrl?: string;
    imagePrompt?: string;
}

export interface BrandColor {
    hex: string;
    name: string;
    usage: string;
    psychology?: string;
}

export interface BrandFont {
    family: string;
    usage: string;
    description: string;
    pairingRole?: 'Headline' | 'Subheadline' | 'Body' | 'Accent';
}

export interface Persona {
    name: string;
    demographics: string;
    psychographics: string;
    painPoints: string[];
    behaviors: string[];
}

export interface Competitor {
    name: string;
    differentiation: string;
}

export interface VisualIdentityExtended {
    logoUrl?: string;
    logoStyle?: string;
    logoGenPrompt?: string;
    logoConcepts?: string[];
    generatedLogoUrl?: string;
    patternStyle?: string;
    patternGenPrompt?: string;
    generatedPatternUrl?: string;
    iconographyStyle?: string;
    iconGenPrompt?: string;
    generatedIconUrl?: string;
    moodBoardPrompts?: string[];
    generatedMoodBoardUrls?: string[];
    designRules: string[]; 
    layoutStyle: string;
    imageryGuidelines: string;
}

export interface BrandDNA {
    id: string;
    name: string;
    tagline: string;
    description: string;
    mission: string;
    elevatorPitch: string;
    websiteUrl: string;
    detectedLanguage: string;
    createdAt: number;
    values: string[];
    keyMessaging: string[];
    confidenceScores: {
        visuals: number;
        strategy: number;
        tone: number;
        overall: number;
    };
    trendAlignment?: {
        trendName: string;
        score: number;
        reasoning: string;
    };
    accessibility?: {
        logoAlt: string;
        guidelines: string;
    };
    sonicIdentity?: {
        voiceType: string;
        musicGenre: string;
        soundKeywords: string[];
        audioLogoDescription: string;
    };
    colors: BrandColor[];
    secondaryPalette?: BrandColor[];
    fonts: BrandFont[];
    visualStyle: {
        style: string;
        description: string;
    };
    heroImagePrompt?: string;
    heroImageUrl?: string;
    visualIdentityExtended?: VisualIdentityExtended;
    toneOfVoice: {
        adjectives: string[];
        description: string;
    };
    brandPersonality: string[];
    targetAudience: string;
    personas: Persona[];
    swot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    competitors: Competitor[];
}

export interface CampaignAsset {
    id: string;
    type: 'social' | 'email' | 'ad' | 'video' | 'blog';
    channel: string;
    title: string;
    content: string;
    imagePrompt?: string;
    imageUrl?: string;
    videoUrl?: string;
    isGeneratingImage?: boolean;
    isGeneratingVideo?: boolean;
    scheduledAt?: string;
    syncStatus?: 'pending' | 'syncing' | 'synced' | 'error'; // NEW: Track live sync
    syncError?: string; // NEW: Error details
}

export interface SavedCampaign {
    id: string;
    dna: BrandDNA;
    goal: string;
    assets: CampaignAsset[];
    timestamp: number;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    tier: 'free' | 'pro' | 'agency';
}

export type LLMProviderId = 'google' | 'openai' | 'anthropic' | 'mistral' | 'xai' | 'deepseek' | 'groq' | 'together' | 'openrouter' | 'perplexity' | 'qwen' | 'cohere' | 'meta_llama' | 'microsoft' | 'ollama' | 'custom_openai' | 'sambanova' | 'cerebras' | 'hyperbolic' | 'nebius' | 'aws_bedrock' | 'friendli' | 'replicate_llm' | 'minimax' | 'hunyuan' | 'blackbox' | 'dify' | 'venice' | 'zai' | 'comet' | 'huggingface';

export type ImageProviderId = 'google' | 'openai' | 'openai_dalle_next' | 'stability' | 'sd3' | 'fal_flux' | 'midjourney' | 'runware' | 'leonardo' | 'recraft' | 'xai' | 'amazon' | 'adobe' | 'deepai' | 'replicate' | 'bria' | 'segmind' | 'prodia' | 'ideogram' | 'black_forest_labs' | 'wan' | 'hunyuan_image';

export type VoiceProviderId = 'elevenlabs' | 'openai' | 'playht' | 'cartesia' | 'resemble' | 'murf' | 'wellsaid' | 'deepgram' | 'lmnt' | 'fish' | 'rime' | 'neets' | 'speechify' | 'amazon_polly' | 'google_tts' | 'azure' | 'piper' | 'custom';

export type WorkflowProviderId = 'n8n' | 'zapier' | 'make' | 'activepieces' | 'langchain' | 'pipedream' | 'relay' | 'integrately' | 'pabbly' | 'tray' | 'dify' | 'custom_rag';

export interface ProviderConfig {
    provider: string;
    enabled: boolean;
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
    endpoint?: string;
    webhookUrl?: string;
    scheduleWebhookUrl?: string;
    postingWebhookUrl?: string;
    stylePreset?: string;
}

export interface GlobalSettings {
    theme: 'system' | 'light' | 'dark';
    dataCollection: boolean;
    activeLLM: LLMProviderId;
    activeImageGen: ImageProviderId;
    activeVoice: VoiceProviderId;
    activeWorkflow: WorkflowProviderId;
    whiteLabel?: { enabled: boolean; agencyName: string; logoUrl: string; };
    llms: Record<string, ProviderConfig>;
    image: Record<string, ProviderConfig>;
    voice: Record<string, ProviderConfig>;
    workflows: Record<string, ProviderConfig>;
}

export type AgentRole = 'support' | 'sales' | 'content_guardian' | 'creative_director';

export interface AgentGuardrails {
    strictness: 'low' | 'medium' | 'high';
    forbiddenTopics: string[];
    requiredPhrases: string[];
    knowledgeBaseLimit: boolean;
}

export interface BattleReport {
    winner: 'A' | 'B' | 'Tie';
    summary: string;
    metrics: { subject: string; A: number; B: number; fullMark: number }[];
    gapAnalysis: string;
    visualCritique: string;
}

export interface TrendPulseItem {
    id: string;
    topic: string;
    relevanceScore: number;
    summary: string;
    suggestedAngle: string;
}

export interface CloserReport {
    gaps: string[];
    opportunities: string[];
    recommendedTier: 'Starter' | 'Growth' | 'Dominate';
    tierReasoning: string;
    projectedWins: string;
    auditPoints: string[];
    marketContext: string;
    archetypeAnalysis: string;
    packages: {
        starter: { title: string; price: string; features: string[] };
        growth: { title: string; price: string; features: string[] };
        dominate: { title: string; price: string; features: string[] };
    };
}

export interface FollowUpEmail {
    day: number;
    subject: string;
    body: string;
}

export interface CloserPortfolio {
    subjectLine: string;
    emailBody: string;
    closingScript: string;
    objectionHandling: { objection: string; rebuttal: string }[];
    followUpSequence: FollowUpEmail[];
    report: CloserReport;
    posts: SamplePost[];
    targetEssence: {
        detectedMission: string;
        primaryTone: string;
        visualDNA: string;
        primaryColors: string[];
    };
}

export interface LeadProfile {
    id: string;
    name: string;
    address: string;
    rating?: number;
    website?: string;
    techStack?: string[];
    contactInfo?: {
        email?: string;
        phone?: string;
        socials?: { platform: string; url: string }[];
    };
    gapAnalysis: {
        missingWebsite: boolean;
        lowRating: boolean;
        socialSilence: boolean;
        opportunity: string;
        vulnerabilityDeepDive: string;
    };
    closerPortfolio?: CloserPortfolio;
}

export interface WebsiteData {
    title: string;
    metaDescription: string;
    sections: {
        id: string;
        type: 'hero' | 'features' | 'about' | 'cta' | 'footer';
        content: {
            headline?: string;
            subheadline?: string;
            ctaText?: string;
            imageUrl?: string;
            imagePrompt?: string;
            items?: { title: string; description: string }[];
        };
    }[];
}
