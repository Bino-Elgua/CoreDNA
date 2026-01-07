
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSettings, LLMProviderId, ImageProviderId, VoiceProviderId, WorkflowProviderId } from '../types';
import { useNavigate } from 'react-router-dom';
import { workflowProviderManager, WorkflowProviderConfig } from '../services/workflowProvider';

const INITIAL_SETTINGS: GlobalSettings = {
    theme: 'system',
    dataCollection: true,
    activeLLM: 'google',
    activeImageGen: 'google',
    activeVoice: 'openai',
    activeWorkflow: 'n8n',
    rlm: { enabled: false, rootModel: 'google', recursiveModel: 'openai', maxDepth: 5, contextWindow: 200000 },
    inference: {
        speculativeDecoding: { enabled: false, autoActivateOnCampaigns: false, autoActivateOnWebsiteGen: false, autoActivateOnRLM: false },
        selfConsistency: { enabled: false, numSamples: 3, useOnConsistencyScore: false, useOnDNAExtraction: false, useOnCloserReplies: false },
        skeletonOfThought: { enabled: false, liveUIEnabled: false, useOnBattleMode: false, useOnCampaignPlanning: false, useOnRLMAnalysis: false },
        chainOfVerification: { enabled: false, autoVerifyAllPaidOutputs: false, checkCrossReferences: false, flagInconsistencies: false, reverifyMathLogic: false }
    },
    whiteLabel: { enabled: false, agencyName: '', logoUrl: '' },
    llms: {
        google: { provider: 'google', enabled: true, apiKey: process.env.API_KEY || '' },
        openai: { provider: 'openai', enabled: false, apiKey: '', defaultModel: 'gpt-4o' },
        anthropic: { provider: 'anthropic', enabled: false, apiKey: '', defaultModel: 'claude-3-5-sonnet-latest' },
        mistral: { provider: 'mistral', enabled: false, apiKey: '', defaultModel: 'mistral-large-latest', baseUrl: 'https://api.mistral.ai/v1' },
        xai: { provider: 'xai', enabled: false, apiKey: '', defaultModel: 'grok-beta', baseUrl: 'https://api.x.ai/v1' },
        deepseek: { provider: 'deepseek', enabled: false, apiKey: '', defaultModel: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
        groq: { provider: 'groq', enabled: false, apiKey: '', defaultModel: 'llama3-70b-8192', baseUrl: 'https://api.groq.com/openai/v1' },
        together: { provider: 'together', enabled: false, apiKey: '', defaultModel: 'meta-llama/Llama-3-70b-chat-hf', baseUrl: 'https://api.together.xyz/v1' },
        openrouter: { provider: 'openrouter', enabled: false, apiKey: '', defaultModel: 'anthropic/claude-3.5-sonnet', baseUrl: 'https://openrouter.ai/api/v1' },
        perplexity: { provider: 'perplexity', enabled: false, apiKey: '', defaultModel: 'llama-3-sonar-large-32k-online', baseUrl: 'https://api.perplexity.ai' },
        qwen: { provider: 'qwen', enabled: false, apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max' },
        cohere: { provider: 'cohere', enabled: false, apiKey: '', defaultModel: 'command-r-plus' },
        meta_llama: { provider: 'meta_llama', enabled: false, apiKey: '', baseUrl: 'https://api.together.xyz/v1', defaultModel: 'meta-llama/Llama-3.3-70b-instruct-turbo' }, // NEW
        microsoft: { provider: 'microsoft', enabled: false, apiKey: '', defaultModel: 'gpt-4', baseUrl: 'https://YOUR_RESOURCE.openai.azure.com/' },
        ollama: { provider: 'ollama', enabled: false, apiKey: '', baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3' },
        custom_openai: { provider: 'custom_openai', enabled: false, apiKey: '', baseUrl: 'http://localhost:1234/v1' },
        // High Performance
        sambanova: { provider: 'sambanova', enabled: false, apiKey: '', baseUrl: 'https://api.sambanova.ai/v1' },
        cerebras: { provider: 'cerebras', enabled: false, apiKey: '', baseUrl: 'https://api.cerebras.ai/v1' },
        hyperbolic: { provider: 'hyperbolic', enabled: false, apiKey: '', baseUrl: 'https://api.hyperbolic.xyz/v1' },
        nebius: { provider: 'nebius', enabled: false, apiKey: '', baseUrl: 'https://api.studio.nebius.ai/v1' },
        aws_bedrock: { provider: 'aws_bedrock', enabled: false, apiKey: '' },
        friendli: { provider: 'friendli', enabled: false, apiKey: '' },
        replicate_llm: { provider: 'replicate_llm', enabled: false, apiKey: '' },
        minimax: { provider: 'minimax', enabled: false, apiKey: '' },
        hunyuan: { provider: 'hunyuan', enabled: false, apiKey: '' },
        // New Additions
        blackbox: { provider: 'blackbox', enabled: false, apiKey: '' },
        dify: { provider: 'dify', enabled: false, apiKey: '', baseUrl: 'https://api.dify.ai/v1' },
        // Niche / Legacy
        venice: { provider: 'venice', enabled: false, apiKey: '' },
        zai: { provider: 'zai', enabled: false, apiKey: '' },
        comet: { provider: 'comet', enabled: false, apiKey: '' },
        huggingface: { provider: 'huggingface', enabled: false, apiKey: '' },
    },
    image: {
        google: { provider: 'google', enabled: true, apiKey: '' },
        openai: { provider: 'openai', enabled: false, apiKey: '' }, // DALL-E 3
        openai_dalle_next: { provider: 'openai_dalle_next', enabled: false, apiKey: '' }, // NEW DALL-E 4
        stability: { provider: 'stability', enabled: false, apiKey: '' },
        sd3: { provider: 'sd3', enabled: false, apiKey: '' }, // NEW Stable Diffusion 3
        fal_flux: { provider: 'fal_flux', enabled: false, apiKey: '' },
        midjourney: { provider: 'midjourney', enabled: false, apiKey: '' }, // Proxy
        runware: { provider: 'runware', enabled: false, apiKey: '' },
        leonardo: { provider: 'leonardo', enabled: false, apiKey: '' },
        recraft: { provider: 'recraft', enabled: false, apiKey: '' },
        xai: { provider: 'xai', enabled: false, apiKey: '' },
        amazon: { provider: 'amazon', enabled: false, apiKey: '' },
        adobe: { provider: 'adobe', enabled: false, apiKey: '' },
        deepai: { provider: 'deepai', enabled: false, apiKey: '' },
        replicate: { provider: 'replicate', enabled: false, apiKey: '' },
        bria: { provider: 'bria', enabled: false, apiKey: '' },
        segmind: { provider: 'segmind', enabled: false, apiKey: '' },
        prodia: { provider: 'prodia', enabled: false, apiKey: '' },
        ideogram: { provider: 'ideogram', enabled: false, apiKey: '' },
        black_forest_labs: { provider: 'black_forest_labs', enabled: false, apiKey: '' },
        wan: { provider: 'wan', enabled: false, apiKey: '' },
        hunyuan_image: { provider: 'hunyuan_image', enabled: false, apiKey: '' },
    },
    voice: {
        elevenlabs: { provider: 'elevenlabs', enabled: false, apiKey: '' },
        openai: { provider: 'openai', enabled: false, apiKey: '' },
        playht: { provider: 'playht', enabled: false, apiKey: '' },
        cartesia: { provider: 'cartesia', enabled: false, apiKey: '' }, // Fastest TTS
        resemble: { provider: 'resemble', enabled: false, apiKey: '' }, // NEW
        murf: { provider: 'murf', enabled: false, apiKey: '' }, // NEW
        wellsaid: { provider: 'wellsaid', enabled: false, apiKey: '' }, // NEW
        deepgram: { provider: 'deepgram', enabled: false, apiKey: '' },
        lmnt: { provider: 'lmnt', enabled: false, apiKey: '' },
        fish: { provider: 'fish', enabled: false, apiKey: '' },
        rime: { provider: 'rime', enabled: false, apiKey: '' },
        neets: { provider: 'neets', enabled: false, apiKey: '' },
        speechify: { provider: 'speechify', enabled: false, apiKey: '' },
        amazon_polly: { provider: 'amazon_polly', enabled: false, apiKey: '' },
        google_tts: { provider: 'google_tts', enabled: false, apiKey: '' },
        azure: { provider: 'azure', enabled: false, apiKey: '', endpoint: '' },
        piper: { provider: 'piper', enabled: false, endpoint: 'http://localhost:5000' },
        custom: { provider: 'custom', enabled: false, endpoint: '' },
    },
    workflows: {
        n8n: { provider: 'n8n', enabled: false, webhookUrl: '', scheduleWebhookUrl: '' },
        zapier: { provider: 'zapier', enabled: false, webhookUrl: '', postingWebhookUrl: '' },
        make: { provider: 'make', enabled: false, webhookUrl: '', scheduleWebhookUrl: '' },
        activepieces: { provider: 'activepieces', enabled: false, webhookUrl: '' },
        langchain: { provider: 'langchain', enabled: false, webhookUrl: '' }, // NEW
        pipedream: { provider: 'pipedream', enabled: false, webhookUrl: '' },
        relay: { provider: 'relay', enabled: false, webhookUrl: '' },
        integrately: { provider: 'integrately', enabled: false, webhookUrl: '' },
        pabbly: { provider: 'pabbly', enabled: false, webhookUrl: '' },
        tray: { provider: 'tray', enabled: false, webhookUrl: '' },
        dify: { provider: 'dify', enabled: false, apiKey: '', webhookUrl: '' },
        custom_rag: { provider: 'custom_rag', enabled: false, webhookUrl: '' },
    }
};

const PROVIDER_META: Record<string, { title: string, icon: string, fields: string[], getKeyUrl?: string }> = {
    // LLMs
    google: { title: 'Google Gemini', icon: 'G', fields: ['apiKey'], getKeyUrl: 'https://aistudio.google.com/app/apikey' },
    openai: { title: 'OpenAI', icon: 'O', fields: ['apiKey', 'defaultModel'], getKeyUrl: 'https://platform.openai.com/api-keys' },
    anthropic: { title: 'Anthropic', icon: 'C', fields: ['apiKey', 'defaultModel'], getKeyUrl: 'https://console.anthropic.com/settings/keys' },
    mistral: { title: 'Mistral AI', icon: 'M', fields: ['apiKey', 'baseUrl', 'defaultModel'], getKeyUrl: 'https://console.mistral.ai/api-keys/' },
    meta_llama: { title: 'Meta Llama 3', icon: '🦙', fields: ['apiKey', 'baseUrl', 'defaultModel'], getKeyUrl: 'https://www.llama.com/' }, // NEW
    xai: { title: 'xAI (Grok)', icon: 'X', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://console.x.ai/' },
    deepseek: { title: 'DeepSeek', icon: 'D', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://platform.deepseek.com/api_keys' },
    groq: { title: 'Groq', icon: 'Gq', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://console.groq.com/keys' },
    together: { title: 'Together AI', icon: 'T', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://api.together.xyz/settings/api-keys' },
    openrouter: { title: 'OpenRouter', icon: 'OR', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://openrouter.ai/keys' },
    perplexity: { title: 'Perplexity', icon: 'P', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://www.perplexity.ai/settings/api' },
    qwen: { title: 'Qwen (Alibaba)', icon: 'Q', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://bailian.console.aliyun.com/' },
    cohere: { title: 'Cohere', icon: 'Co', fields: ['apiKey'], getKeyUrl: 'https://dashboard.cohere.com/api-keys' },
    microsoft: { title: 'Azure OpenAI', icon: 'Az', fields: ['apiKey', 'baseUrl', 'defaultModel'], getKeyUrl: 'https://portal.azure.com/' },
    ollama: { title: 'Ollama (Local)', icon: 'Ol', fields: ['baseUrl', 'defaultModel'], getKeyUrl: 'https://ollama.com/download' },
    custom_openai: { title: 'Custom / Local', icon: '?', fields: ['baseUrl', 'apiKey'] },
    sambanova: { title: 'SambaNova', icon: 'SN', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://cloud.sambanova.ai/' },
    cerebras: { title: 'Cerebras', icon: 'Ce', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://cloud.cerebras.ai/' },
    hyperbolic: { title: 'Hyperbolic', icon: 'Hy', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://app.hyperbolic.xyz/' },
    nebius: { title: 'Nebius', icon: 'Nb', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://studio.nebius.ai/' },
    aws_bedrock: { title: 'AWS Bedrock', icon: 'AWS', fields: ['apiKey'], getKeyUrl: 'https://console.aws.amazon.com/bedrock/' },
    friendli: { title: 'Friendli', icon: 'Fr', fields: ['apiKey'], getKeyUrl: 'https://suite.friendli.ai/' },
    replicate_llm: { title: 'Replicate', icon: 'R', fields: ['apiKey'], getKeyUrl: 'https://replicate.com/account/api-tokens' },
    minimax: { title: 'MiniMax', icon: 'Mm', fields: ['apiKey'], getKeyUrl: 'https://platform.minimaxi.com/' },
    hunyuan: { title: 'Hunyuan', icon: 'H', fields: ['apiKey'], getKeyUrl: 'https://cloud.tencent.com/product/hunyuan' },
    blackbox: { title: 'Blackbox', icon: 'B', fields: ['apiKey'], getKeyUrl: 'https://www.blackbox.ai/' },
    dify: { title: 'Dify.ai', icon: 'Di', fields: ['apiKey', 'baseUrl'], getKeyUrl: 'https://cloud.dify.ai/' },
    venice: { title: 'Venice', icon: 'V', fields: ['apiKey'], getKeyUrl: 'https://venice.ai/' },
    zai: { title: 'Zai', icon: 'Z', fields: ['apiKey'], getKeyUrl: 'https://zai.ai/' },
    comet: { title: 'Comet', icon: 'Cm', fields: ['apiKey'], getKeyUrl: 'https://www.comet.com/' },
    huggingface: { title: 'HuggingFace', icon: 'HF', fields: ['apiKey'], getKeyUrl: 'https://huggingface.co/settings/tokens' },

    // Image
    stability: { title: 'Stability AI', icon: 'S', fields: ['apiKey'], getKeyUrl: 'https://platform.stability.ai/account/keys' },
    sd3: { title: 'Stable Diffusion 3', icon: 'SD', fields: ['apiKey'], getKeyUrl: 'https://platform.stability.ai/' }, // NEW
    openai_dalle_next: { title: 'DALL-E 4 / GPT Image', icon: 'O+', fields: ['apiKey'], getKeyUrl: 'https://platform.openai.com/' }, // NEW
    fal_flux: { title: 'Fal.ai (Flux)', icon: 'F', fields: ['apiKey'], getKeyUrl: 'https://fal.ai/dashboard/keys' },
    midjourney: { title: 'Midjourney', icon: 'Mj', fields: ['apiKey'], getKeyUrl: 'https://www.midjourney.com/account' },
    runware: { title: 'Runware', icon: 'Rw', fields: ['apiKey'], getKeyUrl: 'https://runware.ai/' },
    leonardo: { title: 'Leonardo.ai', icon: 'L', fields: ['apiKey'], getKeyUrl: 'https://app.leonardo.ai/api-access' },
    recraft: { title: 'Recraft', icon: 'Rc', fields: ['apiKey'], getKeyUrl: 'https://www.recraft.ai/' },
    amazon: { title: 'Amazon Titan', icon: 'Am', fields: ['apiKey'], getKeyUrl: 'https://aws.amazon.com/bedrock/titan/' },
    adobe: { title: 'Adobe Firefly', icon: 'Ad', fields: ['apiKey'], getKeyUrl: 'https://firefly.adobe.com/' },
    deepai: { title: 'DeepAI', icon: 'Da', fields: ['apiKey'], getKeyUrl: 'https://deepai.org/dashboard/profile' },
    replicate: { title: 'Replicate', icon: 'R', fields: ['apiKey'], getKeyUrl: 'https://replicate.com/account/api-tokens' },
    bria: { title: 'Bria', icon: 'Br', fields: ['apiKey'], getKeyUrl: 'https://bria.ai/' },
    segmind: { title: 'Segmind', icon: 'Sm', fields: ['apiKey'], getKeyUrl: 'https://www.segmind.com/' },
    prodia: { title: 'Prodia', icon: 'Pr', fields: ['apiKey'], getKeyUrl: 'https://app.prodia.com/api' },
    ideogram: { title: 'Ideogram', icon: 'Id', fields: ['apiKey'], getKeyUrl: 'https://ideogram.ai/' },
    black_forest_labs: { title: 'Black Forest', icon: 'BF', fields: ['apiKey'], getKeyUrl: 'https://blackforestlabs.ai/' },
    wan: { title: 'Wan', icon: 'W', fields: ['apiKey'], getKeyUrl: 'https://wan.ai/' },
    hunyuan_image: { title: 'Hunyuan', icon: 'Hi', fields: ['apiKey'], getKeyUrl: 'https://cloud.tencent.com/product/hunyuan' },

    // Voice
    elevenlabs: { title: 'ElevenLabs', icon: '11', fields: ['apiKey'], getKeyUrl: 'https://elevenlabs.io/app/settings/api-keys' },
    playht: { title: 'PlayHT', icon: 'Ph', fields: ['apiKey'], getKeyUrl: 'https://play.ht/studio/api-access' },
    cartesia: { title: 'Cartesia', icon: 'Ca', fields: ['apiKey'], getKeyUrl: 'https://play.cartesia.ai/' },
    resemble: { title: 'Resemble AI', icon: 'Rs', fields: ['apiKey'], getKeyUrl: 'https://www.resemble.ai/' }, // NEW
    murf: { title: 'Murf AI', icon: 'Mu', fields: ['apiKey'], getKeyUrl: 'https://murf.ai/' }, // NEW
    wellsaid: { title: 'WellSaid Labs', icon: 'WS', fields: ['apiKey'], getKeyUrl: 'https://wellsaidlabs.com/' }, // NEW
    deepgram: { title: 'Deepgram', icon: 'Dg', fields: ['apiKey'], getKeyUrl: 'https://console.deepgram.com/' },
    lmnt: { title: 'LMNT', icon: 'Lm', fields: ['apiKey'], getKeyUrl: 'https://app.lmnt.com/account' },
    fish: { title: 'Fish Audio', icon: 'Fi', fields: ['apiKey'], getKeyUrl: 'https://fish.audio/' },
    rime: { title: 'Rime', icon: 'Ri', fields: ['apiKey'], getKeyUrl: 'https://rime.ai/' },
    neets: { title: 'Neets', icon: 'Nt', fields: ['apiKey'], getKeyUrl: 'https://neets.ai/' },
    speechify: { title: 'Speechify', icon: 'Sp', fields: ['apiKey'], getKeyUrl: 'https://speechify.com/' },
    amazon_polly: { title: 'Amazon Polly', icon: 'AP', fields: ['apiKey'], getKeyUrl: 'https://aws.amazon.com/polly/' },
    google_tts: { title: 'Google TTS', icon: 'G', fields: ['apiKey'], getKeyUrl: 'https://console.cloud.google.com/apis/credentials' },
    azure: { title: 'Azure Speech', icon: 'Az', fields: ['apiKey', 'endpoint'], getKeyUrl: 'https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeech' },
    piper: { title: 'Piper (Local)', icon: 'Pi', fields: ['endpoint'], getKeyUrl: 'https://github.com/rhasspy/piper' },
    custom: { title: 'Custom TTS', icon: '?', fields: ['endpoint'] },

    // Workflows
    n8n: { title: 'n8n', icon: 'n8', fields: ['webhookUrl'], getKeyUrl: 'https://n8n.io/' },
    zapier: { title: 'Zapier', icon: 'Z', fields: ['webhookUrl'], getKeyUrl: 'https://zapier.com/' },
    make: { title: 'Make.com', icon: 'M', fields: ['webhookUrl'], getKeyUrl: 'https://www.make.com/' },
    activepieces: { title: 'ActivePieces', icon: 'Ap', fields: ['webhookUrl'], getKeyUrl: 'https://www.activepieces.com/' },
    langchain: { title: 'LangChain / Graph', icon: 'LC', fields: ['webhookUrl'], getKeyUrl: 'https://langchain.com/' }, // NEW
    pipedream: { title: 'Pipedream', icon: 'Pd', fields: ['webhookUrl'], getKeyUrl: 'https://pipedream.com/settings/api_keys' },
    relay: { title: 'Relay.app', icon: 'Ry', fields: ['webhookUrl'], getKeyUrl: 'https://www.relay.app/' },
    integrately: { title: 'Integrately', icon: 'In', fields: ['webhookUrl'], getKeyUrl: 'https://integrately.com/' },
    pabbly: { title: 'Pabbly', icon: 'Pb', fields: ['webhookUrl'], getKeyUrl: 'https://www.pabbly.com/connect/' },
    tray: { title: 'Tray.io', icon: 'Tr', fields: ['webhookUrl'], getKeyUrl: 'https://tray.io/' },
    custom_rag: { title: 'Custom RAG', icon: 'Cr', fields: ['webhookUrl'] },
};

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'llm' | 'image' | 'voice' | 'workflow' | 'agency' | 'rlm' | 'inference' | 'website'>('llm');
    const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);

    // Load settings on mount
    useEffect(() => {
        const stored = localStorage.getItem('core_dna_settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSettings(prev => ({
                    ...prev,
                    ...parsed,
                    llms: { ...prev.llms, ...parsed.llms },
                    image: { ...prev.image, ...parsed.image },
                    voice: { ...prev.voice, ...parsed.voice },
                    workflows: { ...prev.workflows, ...parsed.workflows },
                    whiteLabel: { ...prev.whiteLabel, ...parsed.whiteLabel },
                    inference: { ...prev.inference, ...parsed.inference }
                }));
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('core_dna_settings', JSON.stringify(settings));
        setHasChanges(false);
        window.dispatchEvent(new Event('settingsUpdated'));
        alert("Settings saved successfully. Neural pathways updated.");
    };

    const updateProvider = (category: keyof GlobalSettings, key: string, updates: Partial<any>) => {
        setSettings(prev => ({
            ...prev,
            [category]: { 
                ...prev[category] as any, 
                [key]: { ...(prev[category] as any)[key] || (INITIAL_SETTINGS[category] as any)[key], ...updates } 
            }
        }));
        setHasChanges(true);
    };

    const TabButton = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${
                activeTab === id
                    ? 'border-dna-primary text-dna-primary bg-dna-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    const ProviderCard = ({ id, category, data, isActive, onToggle }: any) => {
        const meta = PROVIDER_META[id] || { title: id, icon: id.charAt(0).toUpperCase(), fields: ['apiKey'], getKeyUrl: '' };
        const isWorkflowProvider = category === 'workflows';

        const handleConfigureWorkflow = () => {
            if (data.enabled && isWorkflowProvider) {
                // Save the selected workflow provider to workflowProviderManager
                const config: WorkflowProviderConfig = {
                    type: id as any,
                    apiKey: data.apiKey || '',
                    baseUrl: data.baseUrl,
                    webhookUrl: data.webhookUrl,
                };
                workflowProviderManager.setConfig(config);
                navigate('/automations');
            }
        };
        
        return (
            <div className={`p-6 rounded-2xl border transition-all relative ${
                data.enabled 
                ? 'bg-white dark:bg-gray-800 border-dna-primary/50 shadow-lg shadow-dna-primary/5' 
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-70 hover:opacity-100'
            }`}>
                {isActive && (
                    <div className="absolute top-0 right-0 bg-dna-primary text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                        Active Driver
                    </div>
                )}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner ${data.enabled ? 'bg-gradient-to-br from-dna-primary to-dna-secondary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            {meta.icon}
                        </div>
                        <div>
                            <h3 className="font-bold font-display text-lg leading-tight">{meta.title}</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onToggle}
                        className={`w-12 h-6 rounded-full relative transition-colors ${data.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${data.enabled ? 'translate-x-6' : ''}`} />
                    </button>
                </div>
                {data.enabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {meta.fields.map((field: string) => (
                            <div key={field}>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {field === 'apiKey' ? 'API Key' : field === 'baseUrl' ? 'Base URL' : field === 'defaultModel' ? 'Model ID' : field === 'endpoint' ? 'Endpoint URL' : field === 'webhookUrl' ? 'Webhook URL' : field}
                                </label>
                                <input 
                                    type={field === 'apiKey' || field === 'endpoint' ? 'password' : 'text'}
                                    value={data[field] || ''}
                                    onChange={e => {
                                        updateProvider(category, id, { [field]: e.target.value });
                                        // For workflow providers, also update workflowProviderManager
                                        if (isWorkflowProvider && isActive) {
                                            const config: WorkflowProviderConfig = {
                                                type: id as any,
                                                apiKey: field === 'apiKey' ? e.target.value : (data.apiKey || ''),
                                                baseUrl: field === 'baseUrl' ? e.target.value : data.baseUrl,
                                                webhookUrl: field === 'webhookUrl' ? e.target.value : data.webhookUrl,
                                            };
                                            workflowProviderManager.setConfig(config);
                                        }
                                    }}
                                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-dna-primary outline-none text-sm font-mono"
                                    placeholder={field === 'baseUrl' ? 'https://api...' : field === 'webhookUrl' ? 'https://webhook.url...' : ''}
                                />
                                {(field === 'apiKey' || field === 'webhookUrl') && meta.getKeyUrl && (
                                    <a 
                                        href={meta.getKeyUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[10px] text-dna-primary hover:text-dna-secondary hover:underline flex items-center gap-1 mt-1 font-medium"
                                    >
                                        Get {field === 'apiKey' ? 'API Key' : 'Details'} &rarr;
                                    </a>
                                )}
                            </div>
                        ))}
                        {isWorkflowProvider && (
                            <motion.button
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleConfigureWorkflow}
                                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-dna-secondary to-dna-primary text-white font-bold rounded-lg hover:shadow-lg hover:shadow-dna-primary/30 transition-all"
                            >
                                → View Workflows
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary mb-6 transition-colors font-medium group"
            >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back
            </button>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">Neural Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Configure models, voices, and automated scheduling workflows.</p>
                </div>
                {hasChanges && (
                    <motion.button 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={handleSave}
                        className="px-6 py-3 bg-gradient-to-r from-dna-secondary to-dna-primary text-white rounded-xl font-bold shadow-lg hover:shadow-dna-primary/30 flex items-center gap-2"
                    >
                        Save Changes
                    </motion.button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                    <TabButton id="llm" label="Text Intelligence" icon={<span>🧠</span>} />
                    <TabButton id="image" label="Image Generators" icon={<span>🎨</span>} />
                    <TabButton id="voice" label="Voice / TTS" icon={<span>🔊</span>} />
                    <TabButton id="workflow" label="Automations" icon={<span>⚡</span>} />
                    <TabButton id="inference" label="Inference Engine" icon={<span>⚙️</span>} />
                    <TabButton id="website" label="Website Options" icon={<span>🌐</span>} />
                    <TabButton id="agency" label="Agency Branding" icon={<span>🏢</span>} />
                    <TabButton id="rlm" label="RLM Mode" icon={<span>♾️</span>} />
                </div>

                <div className="p-8 bg-gray-50/50 dark:bg-black/20 min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {/* Existing Tabs... */}
                        {activeTab === 'llm' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-yellow-800 dark:text-yellow-400">Primary Text Intelligence</h3>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-500">Select which model powers the main analysis and chat features.</p>
                                    </div>
                                    <select 
                                        value={settings.activeLLM}
                                        onChange={(e) => {
                                            setSettings(prev => ({...prev, activeLLM: e.target.value as LLMProviderId}));
                                            setHasChanges(true);
                                        }}
                                        className="p-2 rounded bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 font-bold"
                                    >
                                        {Object.keys(settings.llms).map(k => (
                                            <option key={k} value={k}>{PROVIDER_META[k]?.title || k}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.keys(settings.llms).map(key => (
                                        <ProviderCard 
                                            key={key} 
                                            id={key} 
                                            category="llms"
                                            data={settings.llms[key]} 
                                            isActive={settings.activeLLM === key}
                                            onToggle={() => updateProvider('llms', key, { enabled: !settings.llms[key].enabled })}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'image' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="mb-6 p-4 bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-pink-800 dark:text-pink-400">Image Generation Engine</h3>
                                        <p className="text-sm text-pink-700 dark:text-pink-500">Powering visual identity creation.</p>
                                    </div>
                                    <select 
                                        value={settings.activeImageGen}
                                        onChange={(e) => {
                                            setSettings(prev => ({...prev, activeImageGen: e.target.value as ImageProviderId}));
                                            setHasChanges(true);
                                        }}
                                        className="p-2 rounded bg-white dark:bg-gray-800 border border-pink-300 dark:border-pink-700 font-bold"
                                    >
                                        {Object.keys(settings.image).map(k => (
                                            <option key={k} value={k}>{PROVIDER_META[k]?.title || k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.keys(settings.image).map(key => (
                                        <ProviderCard 
                                            key={key} 
                                            id={key} 
                                            category="image"
                                            data={settings.image[key]} 
                                            isActive={settings.activeImageGen === key}
                                            onToggle={() => updateProvider('image', key, { enabled: !settings.image[key].enabled })}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'voice' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                 <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-purple-800 dark:text-purple-400">Primary Voice Engine</h3>
                                        <p className="text-sm text-purple-700 dark:text-purple-500">Select the default text-to-speech provider.</p>
                                    </div>
                                    <select 
                                        value={settings.activeVoice}
                                        onChange={(e) => {
                                            setSettings(prev => ({...prev, activeVoice: e.target.value as VoiceProviderId}));
                                            setHasChanges(true);
                                        }}
                                        className="p-2 rounded bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 font-bold"
                                    >
                                        {Object.keys(settings.voice).map(k => (
                                            <option key={k} value={k}>{PROVIDER_META[k]?.title || k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {Object.keys(settings.voice).map(key => (
                                        <ProviderCard 
                                            key={key} 
                                            id={key} 
                                            category="voice"
                                            data={settings.voice[key]} 
                                            isActive={settings.activeVoice === key}
                                            onToggle={() => updateProvider('voice', key, { enabled: !settings.voice[key].enabled })}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'workflow' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-green-800 dark:text-green-400">Default Automation</h3>
                                        <p className="text-sm text-green-700 dark:text-green-500">Primary destination for workflow triggers.</p>
                                    </div>
                                    <select 
                                        value={settings.activeWorkflow}
                                        onChange={(e) => {
                                            setSettings(prev => ({...prev, activeWorkflow: e.target.value as WorkflowProviderId}));
                                            setHasChanges(true);
                                        }}
                                        className="p-2 rounded bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 font-bold"
                                    >
                                        {Object.keys(settings.workflows).map(k => (
                                            <option key={k} value={k}>{PROVIDER_META[k]?.title || k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {Object.keys(settings.workflows).map(key => (
                                        <ProviderCard 
                                            key={key} 
                                            id={key} 
                                            category="workflows"
                                            data={settings.workflows[key]} 
                                            isActive={settings.activeWorkflow === key}
                                            onToggle={() => updateProvider('workflows', key, { enabled: !settings.workflows[key].enabled })}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'website' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="p-6 bg-gradient-to-r from-blue-900 to-cyan-900 rounded-2xl text-white mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-2">
                                            Website Builder Options
                                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">Pro+</span>
                                        </h2>
                                        <p className="text-gray-200 max-w-2xl">
                                            Configure Firebase deployment, Sonic Agent embedding, and website generation features. All settings required for one-click site deployment.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Firebase Configuration */}
                                    <div className="md:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">Firebase Hosting</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure Firebase Hosting credentials for site deployment</p>
                                            </div>
                                            <span className="text-2xl">🔥</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Firebase Project ID</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="your-firebase-project"
                                                    defaultValue={localStorage.getItem('firebase_project_id') || ''}
                                                    onChange={(e) => {
                                                        localStorage.setItem('firebase_project_id', e.target.value);
                                                        setHasChanges(true);
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <p className="text-xs text-gray-400 mt-2">Found in Firebase Console → Project Settings</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Firebase API Key</label>
                                                <input 
                                                    type="password" 
                                                    placeholder="●●●●●●●●●●●●"
                                                    defaultValue={localStorage.getItem('firebase_api_key') || ''}
                                                    onChange={(e) => {
                                                        localStorage.setItem('firebase_api_key', e.target.value);
                                                        setHasChanges(true);
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <p className="text-xs text-gray-400 mt-2">Keep this secret. Generated in Firebase Console</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Firebase Storage Bucket</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="your-project.appspot.com"
                                                    defaultValue={localStorage.getItem('firebase_storage_bucket') || ''}
                                                    onChange={(e) => {
                                                        localStorage.setItem('firebase_storage_bucket', e.target.value);
                                                        setHasChanges(true);
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <p className="text-xs text-gray-400 mt-2">Format: projectname.appspot.com</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sonic Agent Configuration */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">Sonic Agent</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">24/7 branded AI chat widget</p>
                                            </div>
                                            <span className="text-2xl">🎤</span>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    defaultChecked={!localStorage.getItem('website_disable_sonic_agent') || localStorage.getItem('website_disable_sonic_agent') === 'false'}
                                                    onChange={(e) => {
                                                        localStorage.setItem('website_disable_sonic_agent', (!e.target.checked).toString());
                                                        setHasChanges(true);
                                                    }}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium">Enable Sonic Agent on deployed sites</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    defaultChecked={!localStorage.getItem('website_disable_voice_mode') || localStorage.getItem('website_disable_voice_mode') === 'false'}
                                                    onChange={(e) => {
                                                        localStorage.setItem('website_disable_voice_mode', (!e.target.checked).toString());
                                                        setHasChanges(true);
                                                    }}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium">Enable voice mode (text + voice chat)</span>
                                            </label>
                                            <p className="text-xs text-gray-400 mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                                Sonic Agent uses BrandDNA tone, colors, and fonts. Voice model is configured in Voice/TTS settings.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Blog Section */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">Blog Section</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Hunter tier only</p>
                                            </div>
                                            <span className="text-2xl">📝</span>
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer opacity-50 pointer-events-none">
                                            <input 
                                                type="checkbox" 
                                                disabled
                                                className="w-4 h-4 cursor-not-allowed"
                                            />
                                            <span className="text-sm font-medium">Add blog page to generated sites</span>
                                        </label>
                                        <p className="text-xs text-gray-400 mt-3">Upgrade to Hunter tier to add automated blog section powered by Campaign assets.</p>
                                    </div>

                                    {/* SEO Settings */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">SEO & Analytics</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Auto-configured on site generation</p>
                                            </div>
                                            <span className="text-2xl">🔍</span>
                                        </div>
                                        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
                                            <label className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> Dynamic meta titles & descriptions
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> Open Graph tags (social previews)
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> LocalBusiness JSON-LD schema
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> Mobile-first responsive design
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> Image optimization & lazy loading
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">Website Builder Features</h3>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                                        <li>✓ Auto-generate 5-page responsive sites (Next.js + Tailwind)</li>
                                        <li>✓ Pages: Home, About, Services, Portfolio, Contact</li>
                                        <li>✓ Auto-embed Sonic Agent (AI chat widget + optional voice)</li>
                                        <li>✓ Pull copy from Campaign assets and SWOT analysis</li>
                                        <li>✓ One-click deployment to Firebase Hosting</li>
                                        <li>✓ Live URL + shareable link immediately</li>
                                        <li>✓ Full BrandDNA styling (colors, fonts, spacing)</li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'agency' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white mb-8">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                                                White-Label Mode
                                                <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded uppercase font-black tracking-widest">Pro</span>
                                            </h2>
                                            <p className="text-gray-300 mt-2 max-w-xl">
                                                Remove "Core DNA" branding. Run the entire platform under your agency name, logo, and identity. Perfect for client presentations and reselling.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-sm uppercase tracking-wider">{settings.whiteLabel?.enabled ? 'Active' : 'Disabled'}</span>
                                            <button 
                                                onClick={() => {
                                                    setSettings(prev => ({ ...prev, whiteLabel: { ...prev.whiteLabel, enabled: !prev.whiteLabel?.enabled } } as any));
                                                    setHasChanges(true);
                                                }}
                                                className={`w-14 h-8 rounded-full relative transition-colors ${settings.whiteLabel?.enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.whiteLabel?.enabled ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!settings.whiteLabel?.enabled ? 'opacity-50 pointer-events-none filter grayscale' : ''}`}>
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Agency Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="My Agency Name"
                                            value={settings.whiteLabel?.agencyName || ''}
                                            onChange={(e) => {
                                                setSettings(prev => ({ ...prev, whiteLabel: { ...prev.whiteLabel!, agencyName: e.target.value } }));
                                                setHasChanges(true);
                                            }}
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-dna-primary outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Replaces "Core DNA" in headers, titles, and footers.</p>
                                    </div>

                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Logo URL</label>
                                        <input 
                                            type="text" 
                                            placeholder="https://example.com/logo.png"
                                            value={settings.whiteLabel?.logoUrl || ''}
                                            onChange={(e) => {
                                                setSettings(prev => ({ ...prev, whiteLabel: { ...prev.whiteLabel!, logoUrl: e.target.value } }));
                                                setHasChanges(true);
                                            }}
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-dna-primary outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Replaces the default logo icon. Recommended height: 40px.</p>
                                    </div>
                                    
                                    <div className="md:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm opacity-60">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Custom Domain (Enterprise)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="portal.myagency.com"
                                                disabled
                                                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                            />
                                            <button className="px-4 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-xl font-bold text-xs uppercase" disabled>Contact Sales</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'rlm' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl text-white mb-8">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                                                Recursive Language Model (RLM)
                                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">Pro/Hunter</span>
                                            </h2>
                                            <p className="text-gray-200 mt-2 max-w-2xl">
                                                Process infinite context tasks using recursive language models. Perfect for exhaustive website crawls, deep brand analysis, and extended conversation histories.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-sm uppercase tracking-wider">{settings.rlm?.enabled ? 'Active' : 'Disabled'}</span>
                                            <button 
                                                onClick={() => {
                                                    setSettings(prev => ({ ...prev, rlm: { ...prev.rlm, enabled: !prev.rlm?.enabled } } as any));
                                                    setHasChanges(true);
                                                }}
                                                className={`w-14 h-8 rounded-full relative transition-colors ${settings.rlm?.enabled ? 'bg-purple-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.rlm?.enabled ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!settings.rlm?.enabled ? 'opacity-50 pointer-events-none filter grayscale' : ''}`}>
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Root Model</label>
                                        <select 
                                            value={settings.rlm?.rootModel || 'google'}
                                            onChange={(e) => {
                                                setSettings(prev => ({...prev, rlm: {...prev.rlm, rootModel: e.target.value as any}}));
                                                setHasChanges(true);
                                            }}
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            {Object.keys(settings.llms).map(k => (
                                                <option key={k} value={k}>{PROVIDER_META[k]?.title || k}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-400 mt-2">Primary model for root-level analysis.</p>
                                    </div>

                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Recursive Model</label>
                                        <select 
                                            value={settings.rlm?.recursiveModel || 'openai'}
                                            onChange={(e) => {
                                                setSettings(prev => ({...prev, rlm: {...prev.rlm, recursiveModel: e.target.value as any}}));
                                                setHasChanges(true);
                                            }}
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            {Object.keys(settings.llms).map(k => (
                                                <option key={k} value={k}>{PROVIDER_META[k]?.title || k}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-400 mt-2">Model for recursive sub-task processing.</p>
                                    </div>

                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Max Recursion Depth</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            max="10"
                                            value={settings.rlm?.maxDepth || 5}
                                            onChange={(e) => {
                                                setSettings(prev => ({...prev, rlm: {...prev.rlm, maxDepth: parseInt(e.target.value)}}));
                                                setHasChanges(true);
                                            }}
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">How many recursion levels to process (1-10).</p>
                                    </div>

                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Context Window</label>
                                        <input 
                                            type="number" 
                                            min="50000"
                                            step="10000"
                                            value={settings.rlm?.contextWindow || 200000}
                                            onChange={(e) => {
                                                setSettings(prev => ({...prev, rlm: {...prev.rlm, contextWindow: parseInt(e.target.value)}}));
                                                setHasChanges(true);
                                            }}
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Max tokens per request (50k-1M).</p>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
                                    <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3">RLM Mode Capabilities</h3>
                                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                                        <li>✓ Extract full website content (entire crawl)</li>
                                        <li>✓ Deep brand competitive analysis across multiple competitors</li>
                                        <li>✓ Extended conversation history with Closer Agent</li>
                                        <li>✓ Unlimited context processing for complex tasks</li>
                                        <li>✓ Recursive task decomposition and synthesis</li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'inference' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="p-6 bg-gradient-to-r from-blue-900 to-cyan-900 rounded-2xl text-white mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-2">
                                            Inference Engine
                                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">Pro/Hunter</span>
                                        </h2>
                                        <p className="text-gray-200 max-w-2xl">
                                            Next-gen AI inference techniques to cut latency, boost accuracy, and build trust. Unlock advanced reasoning with Speculative Decoding, Self-Consistency, Skeleton-of-Thought, and Chain-of-Verification.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Speculative Decoding Card */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">⚡ Speculative Decoding</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">2.1x faster token generation using predictive speculative decoding.</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSettings(prev => ({...prev, inference: {...prev.inference, speculativeDecoding: {...prev.inference.speculativeDecoding, enabled: !prev.inference.speculativeDecoding.enabled}}}));
                                                    setHasChanges(true);
                                                }}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${settings.inference?.speculativeDecoding?.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.inference?.speculativeDecoding?.enabled ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <div className={`space-y-3 ${!settings.inference?.speculativeDecoding?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.speculativeDecoding?.autoActivateOnCampaigns || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, speculativeDecoding: {...prev.inference.speculativeDecoding, autoActivateOnCampaigns: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Auto-activate on Campaign Generation</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.speculativeDecoding?.autoActivateOnWebsiteGen || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, speculativeDecoding: {...prev.inference.speculativeDecoding, autoActivateOnWebsiteGen: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Auto-activate on Website Builder</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.speculativeDecoding?.autoActivateOnRLM || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, speculativeDecoding: {...prev.inference.speculativeDecoding, autoActivateOnRLM: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Auto-activate on RLM Deep Tasks</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Self-Consistency Card */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">🎯 Self-Consistency (Best-of-N)</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generate N samples and vote on best answer. Cuts hallucinations dramatically.</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSettings(prev => ({...prev, inference: {...prev.inference, selfConsistency: {...prev.inference.selfConsistency, enabled: !prev.inference.selfConsistency.enabled}}}));
                                                    setHasChanges(true);
                                                }}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${settings.inference?.selfConsistency?.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.inference?.selfConsistency?.enabled ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <div className={`space-y-4 ${!settings.inference?.selfConsistency?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Number of Samples (1-5)</label>
                                                <input type="range" min="1" max="5" value={settings.inference?.selfConsistency?.numSamples || 3} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, selfConsistency: {...prev.inference.selfConsistency, numSamples: parseInt(e.target.value)}}})); setHasChanges(true);}} className="w-full" />
                                                <p className="text-xs text-gray-400 mt-1">Current: {settings.inference?.selfConsistency?.numSamples || 3} samples</p>
                                            </div>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.selfConsistency?.useOnConsistencyScore || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, selfConsistency: {...prev.inference.selfConsistency, useOnConsistencyScore: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Use on Consistency Score</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.selfConsistency?.useOnDNAExtraction || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, selfConsistency: {...prev.inference.selfConsistency, useOnDNAExtraction: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Use on DNA Extraction</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.selfConsistency?.useOnCloserReplies || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, selfConsistency: {...prev.inference.selfConsistency, useOnCloserReplies: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Use on Closer Agent Replies</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Skeleton-of-Thought Card */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">🧩 Skeleton-of-Thought</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Live outline generation → progressive expansion. Watch AI think in real-time.</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSettings(prev => ({...prev, inference: {...prev.inference, skeletonOfThought: {...prev.inference.skeletonOfThought, enabled: !prev.inference.skeletonOfThought.enabled}}}));
                                                    setHasChanges(true);
                                                }}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${settings.inference?.skeletonOfThought?.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.inference?.skeletonOfThought?.enabled ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <div className={`space-y-3 ${!settings.inference?.skeletonOfThought?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.skeletonOfThought?.liveUIEnabled || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, skeletonOfThought: {...prev.inference.skeletonOfThought, liveUIEnabled: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Enable Live UI (Framer Motion)</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.skeletonOfThought?.useOnBattleMode || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, skeletonOfThought: {...prev.inference.skeletonOfThought, useOnBattleMode: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Use on Battle Mode</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.skeletonOfThought?.useOnCampaignPlanning || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, skeletonOfThought: {...prev.inference.skeletonOfThought, useOnCampaignPlanning: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Use on Campaign Planning</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.skeletonOfThought?.useOnRLMAnalysis || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, skeletonOfThought: {...prev.inference.skeletonOfThought, useOnRLMAnalysis: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Use on RLM Deep Analysis</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Chain-of-Verification Card */}
                                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">✅ Chain-of-Verification</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Auto-verify all outputs. Cross-check data, flag inconsistencies, re-verify logic.</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSettings(prev => ({...prev, inference: {...prev.inference, chainOfVerification: {...prev.inference.chainOfVerification, enabled: !prev.inference.chainOfVerification.enabled}}}));
                                                    setHasChanges(true);
                                                }}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${settings.inference?.chainOfVerification?.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.inference?.chainOfVerification?.enabled ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <div className={`space-y-3 ${!settings.inference?.chainOfVerification?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.chainOfVerification?.autoVerifyAllPaidOutputs || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, chainOfVerification: {...prev.inference.chainOfVerification, autoVerifyAllPaidOutputs: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Auto-verify All Paid Outputs</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.chainOfVerification?.checkCrossReferences || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, chainOfVerification: {...prev.inference.chainOfVerification, checkCrossReferences: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Cross-reference with Source Data</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.chainOfVerification?.flagInconsistencies || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, chainOfVerification: {...prev.inference.chainOfVerification, flagInconsistencies: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Flag Inconsistencies</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={settings.inference?.chainOfVerification?.reverifyMathLogic || false} onChange={(e) => {setSettings(prev => ({...prev, inference: {...prev.inference, chainOfVerification: {...prev.inference.chainOfVerification, reverifyMathLogic: e.target.checked}}})); setHasChanges(true);}} className="w-4 h-4" />
                                                <span className="text-sm font-medium">Re-verify Math & Logic</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                                        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">Inference Benefits</h3>
                                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                                            <li>⚡ Speculative Decoding: 2x faster outputs</li>
                                            <li>🎯 Self-Consistency: Hallucination-free results</li>
                                            <li>🧩 Skeleton-of-Thought: Transparent reasoning process</li>
                                            <li>✅ Chain-of-Verification: Legal-grade confidence for reports</li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
