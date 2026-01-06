
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { BrandDNA, CampaignAsset, AgentGuardrails, AgentRole, GlobalSettings, BattleReport, TrendPulseItem, LeadProfile, CloserPortfolio, WebsiteData } from "../types";

const getSettings = (): GlobalSettings => {
    const stored = localStorage.getItem('core_dna_settings');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) { console.error("Error reading settings", e); }
    }
    return {
        activeLLM: 'google',
        activeImageGen: 'google',
        llms: { google: { provider: 'google', enabled: true, apiKey: process.env.API_KEY || '' } },
        image: { google: { provider: 'google', enabled: true, apiKey: '' } },
        voice: {},
        workflows: {},
        theme: 'system',
        dataCollection: true
    } as any;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error?.message || '';
    const status = error?.status || error?.code;
    
    // Retry on Rate Limits (429), Server Errors (5xx), and Network/RPC Errors
    const isRateLimit = status === 429 || msg.includes('429');
    const isServerOverload = status >= 500 || msg.includes('500') || msg.includes('503') || msg.includes('overloaded');
    const isNetworkError = msg.includes('xhr') || msg.includes('fetch') || msg.includes('network') || msg.includes('Rpc failed');

    if (retries > 0 && (isRateLimit || isServerOverload || isNetworkError)) {
      const waitTime = isRateLimit ? baseDelay * 2 : baseDelay; // Wait longer for rate limits
      console.warn(`API Error (${status || 'Network'}). Retrying in ${waitTime}ms... (${retries} retries left)`);
      await delay(waitTime);
      return retryWithBackoff(fn, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

function cleanAndParseJSON(text: string): any {
    if (!text) throw new Error("Empty response from AI");
    let cleanText = text.trim();
    
    // Remove markdown code blocks
    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // Fallback: Try extracting the first valid JSON object or array
        const firstOpen = cleanText.indexOf('{');
        const lastClose = cleanText.lastIndexOf('}');
        const firstArray = cleanText.indexOf('[');
        const lastArray = cleanText.lastIndexOf(']');
        
        let start = -1;
        let end = -1;
        
        // Prioritize the structure that appears first/is outermost
        if (firstOpen !== -1 && (firstArray === -1 || firstOpen < firstArray)) {
            start = firstOpen;
            end = lastClose;
        } else if (firstArray !== -1) {
            start = firstArray;
            end = lastArray;
        }
        
        if (start !== -1 && end !== -1 && end > start) {
            const potentialJson = cleanText.substring(start, end + 1);
            try { 
                return JSON.parse(potentialJson); 
            } catch (e2) { 
                console.error("Failed to parse extracted JSON substring", e2);
            }
        }
        
        console.error("JSON Parsing failed. Raw text:", text);
        throw new Error(`JSON Parse Error: ${e instanceof Error ? e.message : String(e)}`);
    }
}

export async function universalGenerate(
    prompt: string, 
    systemInstruction: string = "",
    images: string[] = [], 
    jsonMode: boolean = false
): Promise<string> {
    const settings = getSettings();
    const provider = settings.activeLLM;
    const config = settings.llms[provider];
    
    const modelToUse = (prompt.includes("Analyze") || prompt.includes("Domination Kit")) ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    if (provider === 'google' || !config?.enabled) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const contents = [];
        // Robust image handling: Ensure img is a string and contains comma before splitting
        for(const img of images) {
            if (img && typeof img === 'string' && img.includes(',')) {
                contents.push({ inlineData: { mimeType: "image/png", data: img.split(',')[1] } });
            }
        }
        contents.push({ text: prompt });
        const resp = await ai.models.generateContent({
            model: modelToUse,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: jsonMode ? "application/json" : "text/plain",
                thinkingConfig: { thinkingBudget: modelToUse.includes('pro') ? 16000 : 0 }
            }
        });
        return resp.text || "";
    }
    return "";
}

const DNA_JSON_STRUCTURE = `
{
  "name": "string",
  "tagline": "string",
  "description": "EXHAUSTIVE 3-PARAGRAPH ANALYSIS OF BRAND POSITIONING AND MARKET STANDING",
  "mission": "DETAILED STRATEGIC MISSION STATEMENT (150+ words)",
  "elevatorPitch": "HIGH-STAKES VENTURE CAPITAL LEVEL PITCH (100+ words)",
  "values": ["VALUE: EXHAUSTIVE DEFINITION AND IMPLEMENTATION STRATEGY"],
  "keyMessaging": ["PILLAR: DETAILED NARRATIVE STRATEGY AND CUSTOMER BENEFIT"],
  "confidenceScores": { "visuals": 95, "strategy": 95, "tone": 95, "overall": 95 },
  "trendAlignment": { "trendName": "string", "score": 95, "reasoning": "PROFESSIONAL LEVEL MACRO-TREND ANALYSIS" },
  "colors": [{ "hex": "HEX", "name": "NAME", "usage": "PRIMARY/ACTION/UI", "psychology": "DEEP COLOR THEORY JUSTIFICATION IN INDUSTRY CONTEXT" }],
  "secondaryPalette": [{ "hex": "HEX", "name": "NAME", "usage": "NEUTRAL/ACCENT/FUNCTIONAL", "psychology": "STRATEGIC INTENT AND CONTRAST ANALYSIS" }],
  "fonts": [{ "family": "string", "usage": "Headline/Body/Accent", "description": "EXHAUSTIVE PSYCHOLOGICAL ANALYSIS AND HIERARCHY ROLE", "pairingRole": "Headline/Body/Accent" }],
  "visualStyle": { "style": "string", "description": "EXHAUSTIVE VISUAL DNA CODE (300+ words covering lighting, texture, and composition)" },
  "visualIdentityExtended": {
      "designRules": ["MANDATORY DESIGN RULE WITH ACTIONABLE GUIDELINE (e.g. Always use 24pt gutter for breathing room)"],
      "layoutStyle": "EXHAUSTIVE GRID, COMPOSITION, AND WHITESPACE STRATEGY",
      "imageryGuidelines": "EXHAUSTIVE DIRECTIVE FOR PHOTOGRAPHY, FILTERS, AND SUBJECT MATTER",
      "logoStyle": "string",
      "logoConcepts": ["DETAILED LOGO EVOLUTION CONCEPT"],
      "logoGenPrompt": "string",
      "moodBoardPrompts": ["string"]
  },
  "toneOfVoice": { "adjectives": ["string"], "description": "EXHAUSTIVE EDITORIAL STYLE GUIDE WITH DOs AND DONTs" },
  "brandPersonality": ["Specific Archetype (e.g. The Outlaw) with 2-sentence reasoning"],
  "targetAudience": "EXHAUSTIVE DEMOGRAPHIC AND PSYCHOGRAPHIC MAP",
  "personas": [{ "name": "string", "demographics": "string", "psychographics": "FULL NARRATIVE BIO (100+ words)", "painPoints": ["SPECIFIC MARKET FRUSTRATION"], "behaviors": ["ACTIONABLE CONSUMER HABIT"] }],
  "swot": { 
      "strengths": ["INSIGHT: HOW TO LEVERAGE THIS FOR REVENUE"], 
      "weaknesses": ["CRITIQUE: SPECIFIC STRUCTURAL VULNERABILITY"], 
      "opportunities": ["BLUE OCEAN: SPECIFIC UNTAPPED MARKET SEGMENT OR SERVICE"], 
      "threats": ["MACRO THREAT: EXTERNAL FORCE CAUSING POTENTIAL DECAY"] 
  },
  "competitors": [{ "name": "string", "differentiation": "EXHAUSTIVE COMPETITIVE ADVANTAGE PLAYBOOK" }]
}
`;

export const analyzeBrandDNA = async (url: string, nameHint: string, competitorUrls: string = "", logoBase64?: string, additionalContext: string = ""): Promise<BrandDNA> => {
  const systemPrompt = `You are an Elite Brand Architect and Business Consultant from a 'Big Three' firm (McKinsey/BCG/Bain). 
  Your analysis must be EXHAUSTIVE, SOPHISTICATED, and ACTIONABLE. 
  Never provide generic bullet points. Every single field in the JSON MUST be filled with a minimum of 2-3 sentences of deep strategic insight.
  If a field asks for a description, provide a full professional report section.
  For 'Market Gaps' in the SWOT section, identify 4 real-world, high-revenue opportunities the brand is currently failing to capture.
  For 'Brand Archetype', use Jungian psychology to explain the brand's 'Core Essence'.`;
  
  const userPrompt = `Analyze the brand located at URL: "${url}" and Name: "${nameHint}". 
  ${competitorUrls ? `Cross-reference with these competitors: ${competitorUrls}.` : ""}
  ${additionalContext ? `Additional Context provided by user: "${additionalContext}"` : ""}
  Return a complete, exhaustive, and actionable Brand DNA profile in the following JSON format. Ensure NO fields are empty or generic.
  ${DNA_JSON_STRUCTURE}`;
  
  try {
      const resultText = await retryWithBackoff(() => universalGenerate(userPrompt, systemPrompt, logoBase64 ? [logoBase64] : [], true));
      const data = cleanAndParseJSON(resultText);
      return { ...data, id: Date.now().toString(), websiteUrl: url, createdAt: Date.now() };
  } catch (error) { 
      console.error("Deep Analysis Failed:", error);
      throw error; 
  }
};

export const runCloserAgent = async (lead: LeadProfile, senderDna?: BrandDNA): Promise<CloserPortfolio> => {
    const systemPrompt = `You are a Senior Strategic Sales Architect for "Core DNA". 
    Construct an EXHAUSTIVE "Domination Kit" for pitching premium agency services. 
    Every section of this kit must be rich with specific, professional insight. 
    
    TASKS:
    1. Perform a "Sample DNA Extraction" of the lead's current brand essence (Mission, Tone, Visuals).
    2. Design 3 specific service packages (Starter, Growth, Dominate) tailored to their gaps.
    3. Generate a "Sample Creative Asset" (Instagram post) showing how we would transform their presence.
    
    IMPORTANT: Use the available contact intel (Email: ${lead.contactInfo?.email || 'N/A'}, Phone: ${lead.contactInfo?.phone || 'N/A'}) to personalize the email body.`;
    
    const userPrompt = `Generate a high-stakes, in-depth "Core DNA Domination Kit" for ${lead.name}. 
    CONTEXT: ${lead.gapAnalysis.vulnerabilityDeepDive}.
    LEAD INTEL: ${JSON.stringify(lead.contactInfo)}
    Return JSON: {
        "targetEssence": {
            "detectedMission": "Strategic summary of what they actually do based on digital presence",
            "primaryTone": "Critique of their current brand voice",
            "visualDNA": "Summary of their current color/visual patterns",
            "primaryColors": ["HEX codes for their current brand"]
        },
        "subjectLine": "Curiosity-gap, high-CTR subject line", 
        "emailBody": "PAS-framework consultative email", 
        "closingScript": "90-second high-impact verbal script",
        "objectionHandling": [{"objection": "string", "rebuttal": "string"}],
        "followUpSequence": [{"day": 1, "subject": "string", "body": "string"}],
        "report": {
            "marketContext": "250 words on local landscape",
            "archetypeAnalysis": "Critique of brand identity",
            "gaps": ["Technical failure points"], 
            "opportunities": ["Growth strategy ROI"], 
            "auditPoints": ["Critical failures"], 
            "recommendedTier": "Growth", 
            "tierReasoning": "Why this tier fits them best", 
            "projectedWins": "Data-driven projections",
            "packages": {
                "starter": { "title": "Core Alignment", "price": "$1,499/mo", "features": ["Feature 1", "Feature 2"] },
                "growth": { "title": "Market Dominance", "price": "$3,499/mo", "features": ["Feature 1", "Feature 2"] },
                "dominate": { "title": "Neural Omnipresence", "price": "$7,999/mo", "features": ["Feature 1", "Feature 2"] }
            }
        },
        "posts": [{"platform": "Instagram", "content": "Sample high-converting caption", "imagePrompt": "Art direction for a transformer post"}]
    }`;
    try {
        const resultText = await retryWithBackoff(() => universalGenerate(userPrompt, systemPrompt, [], true));
        return cleanAndParseJSON(resultText);
    } catch (e) { throw e; }
};

export const findLeadsWithMaps = async (niche: string, latitude: number, longitude: number): Promise<LeadProfile[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use gemini-2.5-flash as it supports Google Maps grounding
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Locate 5 high-potential ${niche} businesses near lat:${latitude}, long:${longitude}. 
        PRIORITY 1: Find valid contact information (Email address and Phone number).
        PRIORITY 2: Find links to their active social media (Instagram, Facebook, LinkedIn).
        PRIORITY 3: Perform a digital presence audit. 
        Use Google Search tool to extract real contact details from their websites or social listings.
        DO NOT return generic business info only. I need specific contact points for outreach.`,
        config: {
            tools: [{googleMaps: {}}, {googleSearch: {}}],
            toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
        },
    });
    const rawText = response.text || "";
    const formatterPrompt = `Convert this business intel into a structured JSON array. 
    For each business, find and populate: 
    - name, address, rating, website
    - contactInfo: { email, phone, socials: [{platform, url}] }
    - gapAnalysis: { missingWebsite, lowRating, socialSilence, opportunity, vulnerabilityDeepDive }
    Text data: "${rawText}"
    Ensure ALL contact fields are attempted. If not found, leave as null, but do not hallucinate.`;
    
    const formatted = await universalGenerate(formatterPrompt, "JSON Data Architect", [], true);
    const leads = cleanAndParseJSON(formatted);
    return leads.map((l: any, i: number) => ({ id: `lead-${Date.now()}-${i}`, ...l }));
};

export const huntCompetitors = async (dna: BrandDNA): Promise<LeadProfile[]> => {
    const systemPrompt = "You are a Lead Generation Specialist. Generate realistic B2B lead profiles.";
    const userPrompt = `
        Based on the brand "${dna.name}" (Industry: ${dna.mission}, Target Audience: ${dna.targetAudience}),
        generate a JSON list of 5 high-potential companies that would be similar or competitors in the same niche.
        Imagine these are real local businesses.
        
        For each, generate:
        - name
        - website (plausible url)
        - revenue (e.g. "$1M - $5M")
        - matchScore (0-100 based on similarity)
        - contactInfo: { email: "plausible contact email" }
        
        Return JSON Array: [{ name, website, revenue, matchScore, contactInfo }]
    `;
    
    try {
        const res = await universalGenerate(userPrompt, systemPrompt, [], true);
        const leads = cleanAndParseJSON(res);
        return leads.map((l: any, i: number) => ({
            id: `hunter-${Date.now()}-${i}`,
            ...l,
            address: "Local Market",
            rating: 4.0 + Math.random(),
            gapAnalysis: {
                missingWebsite: false,
                socialSilence: Math.random() > 0.7,
                opportunity: "Competitor Analysis",
                vulnerabilityDeepDive: "Similar market positioning detected."
            }
        }));
    } catch(e) {
        console.error("Hunter failed", e);
        return [];
    }
};

export const generateCampaignAssets = async (dna: BrandDNA, goal: string, channels: string[], count: number, toneOverride?: string): Promise<CampaignAsset[]> => {
    const userPrompt = `Brand: ${dna.name}. Mission: ${dna.mission}. Tone: ${dna.toneOfVoice.description}. Goal: ${goal}. Channels: ${channels.join(', ')}. Generate ${count} assets. JSON Array of {type, channel, title, content, imagePrompt}. Content must be high-converting and sophisticated.`;
    const res = await universalGenerate(userPrompt, "Copywriter & Art Director", [], true);
    const raw = cleanAndParseJSON(res);
    return raw.map((a: any, i: number) => ({ ...a, id: `asset-${Date.now()}-${i}` }));
};

export const generateAssetImage = async (imagePrompt: string, dnaStyle: string): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: `${imagePrompt}. Brand Guidelines: ${dnaStyle}. 8k resolution, professional advertising aesthetic.` }] } });
    for (const part of resp.candidates?.[0]?.content?.parts || []) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; }
    return undefined;
};

export const generateTrendPulse = async (dna: BrandDNA): Promise<TrendPulseItem[]> => {
    const text = await universalGenerate(`Identify 3 high-impact real-world market trends for ${dna.name}. JSON Array: [{topic, relevanceScore, summary, suggestedAngle}]`, "Market Analyst", [], true);
    const parsed = cleanAndParseJSON(text);
    return parsed.map((x:any, i:number) => ({...x, id: `t-${i}`}));
};

export const runBattleSimulation = async (brandA: BrandDNA, brandB: BrandDNA): Promise<BattleReport> => {
    const res = await universalGenerate(`Head-to-head battle: ${brandA.name} vs ${brandB.name}. Deep analysis. JSON {winner, summary, metrics:[{subject, A, B, fullMark}], gapAnalysis, visualCritique}`, "Strategy Consultant", [], true);
    return cleanAndParseJSON(res);
};

export const createBrandChat = (dna: BrandDNA): Chat => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction: `You are the physical embodiment of ${dna.name}. Your tone is ${dna.toneOfVoice.description}. Your mission is ${dna.mission}.` } });
};

export const createAgentChat = (systemInstruction: string): Chat => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction } });
};

export const generateAgentSystemPrompt = (dna: BrandDNA, role: AgentRole, guardrails: any): string => `You are a ${role} for ${dna.name}. Identity: ${dna.brandPersonality.join(', ')}. Strictness: ${guardrails.strictness}. Use the tone: ${dna.toneOfVoice.description}.`;

export const generateWebsiteData = async (dna: BrandDNA, template: string): Promise<WebsiteData> => {
    const res = await universalGenerate(`Website content for ${dna.name} (${template}). EXHAUSTIVE COPY. JSON {title, metaDescription, sections:[{id, type, content:{headline, subheadline, ctaText, imagePrompt, items:[{title, description}]}}]}`, "Web Architect", [], true);
    return cleanAndParseJSON(res);
};

export const analyzeUploadedAssets = async (images: string[], dna: BrandDNA): Promise<CampaignAsset[]> => {
    const res = await universalGenerate(`Analyze for ${dna.name}. JSON Array.`, "Social Media Director", images, true);
    const parsed = cleanAndParseJSON(res);
    return parsed.map((r:any, i:number) => ({ ...r, id: `up-${i}`, imageUrl: images[i] }));
};

export const optimizeSchedule = async (assets: CampaignAsset[]): Promise<CampaignAsset[]> => assets.map((a, i) => ({ ...a, scheduledAt: new Date(Date.now() + i * 86400000).toISOString() }));

export const generateVeoVideo = async (prompt: string, imageBase64?: string): Promise<string | undefined> => {
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const config = { numberOfVideos: 1, resolution: '720p' as const, aspectRatio: '16:9' as const };
    let operation;
    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.includes(',')) {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            image: { imageBytes: imageBase64.split(',')[1], mimeType: 'image/png' },
            config
        });
    } else {
        operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config });
    }
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    return downloadLink ? `${downloadLink}&key=${process.env.API_KEY}` : undefined;
};

export const runAgentHiveCampaign = async (dna: BrandDNA, goal: string, channel: string, onUpdate: (status: string) => void): Promise<CampaignAsset> => {
    onUpdate("🤖 Strategist: Analyzing angles...");
    const strategy = await universalGenerate(`Deep strategy for ${channel} campaign: "${goal}" for ${dna.name}. 2 sentences.`, "Senior Brand Strategist");
    onUpdate("✍️ Copywriter: Drafting high-converting content...");
    const content = await universalGenerate(`Write sophisticated ${channel} copy for strategy: "${strategy}". Tone: ${dna.toneOfVoice.description}.`, "Conversion Copywriter");
    onUpdate("📸 Visualist: Briefing custom visual identity...");
    const imagePrompt = await universalGenerate(`Art Direction prompt for: "${content}". Focus on: ${dna.visualStyle.description}.`, "Art Director");
    return { id: `hive-${Date.now()}`, type: 'social', channel, title: `Hive: ${goal.substring(0, 20)}`, content, imagePrompt, isGeneratingImage: true };
};

export const refineAssetWithAI = async (dna: BrandDNA, asset: CampaignAsset, instruction: string): Promise<CampaignAsset> => {
    const systemPrompt = "You are an expert Brand Editor.";
    const userPrompt = `Brand: ${dna.name}. Current Asset: {title: "${asset.title}", content: "${asset.content}", prompt: "${asset.imagePrompt}"}. Instruction: "${instruction}". Rewrite everything with 50% more depth. JSON output.`;
    const res = await universalGenerate(userPrompt, systemPrompt, [], true);
    const data = cleanAndParseJSON(res);
    return { ...asset, ...data };
};
