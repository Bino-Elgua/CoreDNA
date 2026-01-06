
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
// Fixed: Removed AgentConfig as it is not exported from types.ts
import { BrandDNA, CampaignAsset, AgentGuardrails, AgentRole, GlobalSettings, LLMProviderId, BattleReport, TrendPulseItem, LeadProfile } from "../types";

// --- Universal Service Configuration ---

const getSettings = (): GlobalSettings => {
    const stored = localStorage.getItem('core_dna_settings');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) { console.error("Error reading settings", e); }
    }
    // Minimal fallback
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

// --- API Helpers ---

// Utility: Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Retry with Exponential Backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429');
    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${baseDelay}ms... (${retries} retries left)`);
      await delay(baseDelay);
      return retryWithBackoff(fn, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

// Universal Chat Completion Router
async function universalGenerate(
    prompt: string, 
    systemInstruction: string = "",
    images: string[] = [], // Base64 strings
    jsonMode: boolean = false
): Promise<string> {
    const settings = getSettings();
    const provider = settings.activeLLM;
    const config = settings.llms[provider];

    if (!config || !config.enabled) {
        throw new Error(`Provider ${provider} is not enabled or configured.`);
    }

    // 1. Google Gemini Native
    if (provider === 'google') {
        // ALWAYS use process.env.API_KEY as per guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const contents = [];
        
        // Add images if present
        for(const img of images) {
            contents.push({ inlineData: { mimeType: "image/png", data: img.split(',')[1] } });
        }
        contents.push({ text: prompt });

        const resp = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: jsonMode ? "application/json" : "text/plain"
            }
        });
        return resp.text || "";
    }

    // 2. OpenAI Compatible (Mistral, Qwen, DeepSeek, OpenAI, etc.)
    // We treat all these as OpenAI-compatible endpoints
    const baseUrl = config.baseUrl || (provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
    
    // Default Models Mapping
    let model = config.defaultModel;
    if (!model) {
        if (provider === 'mistral') model = 'mistral-large-latest';
        if (provider === 'openai') model = 'gpt-4o';
        if (provider === 'deepseek') model = 'deepseek-chat';
        if (provider === 'anthropic') model = 'claude-3-5-sonnet-latest'; // Anthropic usually needs separate SDK but some proxies use OAI format
        if (provider === 'qwen') model = 'qwen-max';
    }

    const messages: any[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

    // Build User Message
    const content: any[] = [{ type: 'text', text: prompt }];
    
    // Add images (OpenAI/Mistral Pixtral format)
    for(const img of images) {
        content.push({
            type: "image_url",
            image_url: { url: img } // Base64
        });
    }
    messages.push({ role: 'user', content: images.length > 0 ? content : prompt });

    const payload: any = {
        model: model,
        messages: messages,
        temperature: 0.7
    };

    if (jsonMode) {
        // Some providers support json_object, others need strict prompt engineering
        if (provider === 'openai' || provider === 'mistral') {
            payload.response_format = { type: "json_object" };
        }
    }

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`${provider.toUpperCase()} API Error: ${err}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
}


// --- DNA Schemas (Simulated for non-Gemini) ---

const DNA_JSON_STRUCTURE = `
{
  "name": "string",
  "tagline": "string",
  "description": "string",
  "detectedLanguage": "string",
  "mission": "string",
  "elevatorPitch": "string",
  "values": ["string"],
  "keyMessaging": ["string"],
  "confidenceScores": { "visuals": 85, "strategy": 85, "tone": 85, "overall": 85 },
  "trendAlignment": { "trendName": "string", "score": 85, "reasoning": "string" },
  "accessibility": { "logoAlt": "string", "guidelines": "string" },
  "sonicIdentity": { "voiceType": "string", "musicGenre": "string", "soundKeywords": ["string"], "audioLogoDescription": "string" },
  "colors": [{ "hex": "#000000", "name": "string", "usage": "string" }],
  "fonts": [{ "family": "string", "usage": "string", "description": "string" }],
  "visualStyle": { "style": "string", "description": "string" },
  "heroImagePrompt": "string",
  "visualIdentityExtended": {
      "logoStyle": "string",
      "logoConcepts": ["string"],
      "logoGenPrompt": "string",
      "patternStyle": "string",
      "patternGenPrompt": "string",
      "iconographyStyle": "string",
      "iconGenPrompt": "string",
      "moodBoardPrompts": ["string"]
  },
  "toneOfVoice": { "adjectives": ["string"], "description": "string" },
  "brandPersonality": ["string"],
  "targetAudience": "string",
  "personas": [{ "name": "string", "demographics": "string", "psychographics": "string", "painPoints": ["string"], "behaviors": ["string"] }],
  "swot": { "strengths": ["string"], "weaknesses": ["string"], "opportunities": ["string"], "threats": ["string"] },
  "competitors": [{ "name": "string", "differentiation": "string" }]
}
`;

// --- Core Functions ---

export const analyzeBrandDNA = async (
    url: string, 
    nameHint: string, 
    competitorUrls: string = "",
    logoBase64?: string,
    additionalContext: string = ""
): Promise<BrandDNA> => {
    
  const systemPrompt = `You are a world-class Brand Strategist. Your output must be strictly valid JSON matching the provided schema.`;
  
  const userPrompt = `
    Analyze the brand for URL: "${url}" and Name: "${nameHint}".
    ${competitorUrls ? `Competitors: ${competitorUrls}` : ""}
    ${additionalContext ? `Context: "${additionalContext}"` : ""}
    
    1. **Language Detection**: Identify the primary language.
    2. **Trend Alignment**: Analyze alignment with 2025 Design Trends.
    3. **Strategy**: Construct the full brand profile.
    4. **Visuals**: Define colors, fonts, and generative prompts.
    5. **Sonic Identity**: Analyze the brand's potential audio brand.
    
    IMPORTANT: Return ONLY valid JSON matching this structure:
    ${DNA_JSON_STRUCTURE}
  `;

  const images = logoBase64 ? [logoBase64] : [];

  try {
      const resultText = await retryWithBackoff(() => universalGenerate(userPrompt, systemPrompt, images, true));
      
      // Sanitization
      let jsonStr = resultText.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      const data = JSON.parse(jsonStr);

      if (!data.colors || data.colors.length === 0) throw new Error("AI returned incomplete data");
      if (logoBase64 && data.visualIdentityExtended) data.visualIdentityExtended.logoUrl = logoBase64;

      return {
          ...data,
          id: Date.now().toString(),
          websiteUrl: url,
          createdAt: Date.now()
      };
  } catch (error) {
      console.error("Brand Analysis Error:", error);
      throw error;
  }
};

export const refineBrandDNA = async (currentDna: BrandDNA, instruction: string): Promise<BrandDNA> => {
    // Helper to strip heavy data for context window
    const sanitizedContext = JSON.parse(JSON.stringify(currentDna));
    delete sanitizedContext.visualIdentityExtended?.logoUrl;
    delete sanitizedContext.visualIdentityExtended?.generatedLogoUrl;
    delete sanitizedContext.heroImageUrl;

    const systemPrompt = "You are an expert Brand Editor. Update the JSON profile based on instructions.";
    const userPrompt = `
        CURRENT PROFILE (JSON): ${JSON.stringify(sanitizedContext)}
        USER INSTRUCTION: "${instruction}"
        
        Return the updated JSON structure completely.
    `;

    try {
        const resultText = await retryWithBackoff(() => universalGenerate(userPrompt, systemPrompt, [], true));
        let jsonStr = resultText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        const data = JSON.parse(jsonStr);
        return {
            ...data,
            id: currentDna.id,
            websiteUrl: currentDna.websiteUrl,
            createdAt: currentDna.createdAt,
            // Restore images that AI doesn't return
            heroImageUrl: currentDna.heroImageUrl,
            visualIdentityExtended: {
                ...data.visualIdentityExtended,
                logoUrl: currentDna.visualIdentityExtended?.logoUrl,
                generatedLogoUrl: currentDna.visualIdentityExtended?.generatedLogoUrl,
                generatedPatternUrl: currentDna.visualIdentityExtended?.generatedPatternUrl,
                generatedIconUrl: currentDna.visualIdentityExtended?.generatedIconUrl,
                generatedMoodBoardUrls: currentDna.visualIdentityExtended?.generatedMoodBoardUrls
            }
        };
    } catch (e) {
        console.error("Refine Error", e);
        throw e;
    }
};

export const generateCampaignAssets = async (
    dna: BrandDNA, 
    goal: string, 
    channels: string[], 
    count: number,
    toneOverride?: string
): Promise<CampaignAsset[]> => {
    
    // Minimal context
    const minimalDna = {
        name: dna.name,
        mission: dna.mission,
        tone: dna.toneOfVoice,
        audience: dna.targetAudience,
        values: dna.values
    };

    const systemPrompt = "You are a Marketing Copywriter. Return a JSON Array of assets.";
    const userPrompt = `
        Brand Context: ${JSON.stringify(minimalDna)}
        Campaign Goal: "${goal}"
        Channels: ${channels.join(', ')}
        ${toneOverride ? `Tone Override: ${toneOverride}` : ''}
        
        Generate ${count} distinct assets.
        Format: JSON Array of objects with keys: "type" (social/email/banner), "channel", "title", "content", "imagePrompt".
    `;

    try {
        const resultText = await retryWithBackoff(() => universalGenerate(userPrompt, systemPrompt, [], true));
        let jsonStr = resultText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        const rawAssets = JSON.parse(jsonStr);
        // Normalize wrapper if AI returned { "assets": [...] } instead of [...]
        const assetsArray = Array.isArray(rawAssets) ? rawAssets : rawAssets.assets || [];

        return assetsArray.map((asset: any, index: number) => ({
            ...asset,
            id: `asset-${Date.now()}-${index}`,
            imagePrompt: asset.imagePrompt || "", 
            isGeneratingImage: !!asset.imagePrompt 
        }));
    } catch (e) {
        console.error("Campaign Gen Error", e);
        throw e;
    }
};

// --- Agent Hive (Multi-Agent) Workflow ---
export const runAgentHiveCampaign = async (dna: BrandDNA, goal: string, channel: string, onUpdate: (status: string) => void): Promise<CampaignAsset> => {
    
    const minimalDna = { name: dna.name, tone: dna.toneOfVoice, audience: dna.targetAudience };

    // 1. Strategist
    onUpdate("🤖 Strategist: Analyzing angles...");
    const strategy = await universalGenerate(
        `Develop a high-impact angle for a ${channel} campaign about "${goal}" for ${dna.name}. Return 1 sentence.`,
        "You are a Senior Brand Strategist."
    );

    // 2. Copywriter
    onUpdate("✍️ Copywriter: Drafting content...");
    const copy = await universalGenerate(
        `Write the content for this ${channel} post based on this strategy: "${strategy}". Brand Context: ${JSON.stringify(minimalDna)}. Return only the copy.`,
        "You are a Conversion Copywriter."
    );

    // 3. Creative Director (Critic)
    onUpdate("🎨 Creative Director: Reviewing...");
    const critique = await universalGenerate(
        `Review this copy: "${copy}". Does it match the brand tone: ${dna.toneOfVoice.description}? If yes, return "APPROVED". If no, rewrite it perfectly.`,
        "You are a strict Creative Director."
    );

    const finalContent = critique.includes("APPROVED") ? copy : critique;

    // 4. Visualist
    onUpdate("📸 Visualist: Briefing image...");
    const imagePrompt = await universalGenerate(
        `Describe a high-converting image for this post: "${finalContent}". Return only the prompt.`,
        "You are an Art Director."
    );

    return {
        id: `hive-${Date.now()}`,
        type: 'social',
        channel: channel,
        title: `Hive Generated: ${goal.substring(0, 20)}`,
        content: finalContent,
        imagePrompt: imagePrompt,
        isGeneratingImage: true,
        imageUrl: undefined
    };
};

// --- Lead Hunter Agent (Maps + Search Grounding) ---
export const findLeadsWithMaps = async (
    niche: string, 
    latitude: number, 
    longitude: number
): Promise<LeadProfile[]> => {
    // ALWAYS use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            // COMBINED POWER: Use Maps to find location + Search to check social footprint
            contents: `Find 5 ${niche} near me. For each, tell me their Name, Address, and Rating. 
            Crucially, search the web to see if they have active social media profiles (Instagram, Facebook, LinkedIn) or if they are "socially silent".`,
            config: {
                // Enable BOTH Maps and Search tools
                tools: [{googleMaps: {}}, {googleSearch: {}}],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude, longitude }
                    }
                }
            },
        });

        // The response contains text and grounding metadata (places).
        // We want the places mainly, but we also want the AI to analyze them.
        // Since we can't force JSON with Maps tools enabled, we parse the groundingChunks
        // or ask the AI to format the text in a very specific way in a follow-up or try to parse the text.
        
        // Strategy: We get the text, which contains the grounded answer. We then use a "Formatter" call to structure it.
        const rawText = response.text || "";
        
        const formatterPrompt = `
            Extract lead data from this text into JSON.
            Text: "${rawText}"
            
            For each business found, I need you to act as a "Sales Investigator".
            Analyze the rating and implied digital presence.
            
            Return a JSON Array of objects:
            {
                "name": string,
                "address": string,
                "rating": number (or null),
                "gapAnalysis": {
                    "missingWebsite": boolean (infer from text if mentioned, else false),
                    "lowRating": boolean (if rating < 4.0),
                    "socialSilence": boolean (true if text implies no social media or inactivity),
                    "opportunity": string (1 short sentence on what service to pitch e.g. "Reputation Management" or "Website Redesign" or "Social Media Awakening")
                }
            }
        `;
        
        const formatted = await universalGenerate(formatterPrompt, "You are a JSON extractor.", [], true);
        const leads = JSON.parse(formatted.replace(/```json|```/g, '').trim());
        
        return leads.map((l: any, i: number) => ({
            id: `lead-${Date.now()}-${i}`,
            ...l
        }));

    } catch (e) {
        console.error("Lead Gen Error", e);
        throw e;
    }
};

export const generateLeadOutreach = async (lead: LeadProfile, senderDna?: BrandDNA): Promise<string> => {
    const systemPrompt = "You are a Master of Cold Outreach. You write short, punchy, value-driven emails/scripts.";
    
    let context = `Lead: ${lead.name} (${lead.address}). Identified Gap: ${lead.gapAnalysis.opportunity}.`;
    if (lead.gapAnalysis.socialSilence) context += " They have no social media presence.";
    
    if (senderDna) {
        context += `\nMy Agency: ${senderDna.name}. Mission: ${senderDna.mission}. Tone: ${senderDna.toneOfVoice.description}.`;
    } else {
        context += `\nMy Agency: TopTier Digital. We help local businesses grow.`;
    }

    const userPrompt = `
        Write a 3-sentence cold email to this lead.
        Focus entirely on solving their specific problem: "${lead.gapAnalysis.opportunity}".
        Do not sound like an AI. Be conversational and direct.
        CONTEXT: ${context}
    `;

    return await universalGenerate(userPrompt, systemPrompt);
};

// --- Trend Pulse Engine ---
export const generateTrendPulse = async (dna: BrandDNA): Promise<TrendPulseItem[]> => {
    // In a real app, this would fetch from Google Trends or News API.
    // Here we use Gemini to "hallucinate" plausible trends based on date or (if available) Search Grounding.
    
    const systemPrompt = "You are a Trend Forecaster. Identify 3 real-world trends relevant to this brand.";
    const userPrompt = `
        Brand: ${dna.name} (${dna.values.join(', ')}).
        Industry Context: ${dna.mission}.
        
        Identify 3 current trending topics or news themes (real or plausible for 2025) that this brand should react to.
        Return JSON Array: [{ "topic": "string", "relevanceScore": 85, "summary": "string", "suggestedAngle": "string" }]
    `;

    try {
        const text = await universalGenerate(userPrompt, systemPrompt, [], true);
        const json = JSON.parse(text.replace(/```json|```/g, '').trim());
        return Array.isArray(json) ? json.map((x, i) => ({...x, id: `trend-${i}`})) : [];
    } catch(e) {
        console.error(e);
        return [];
    }
};

// --- Battle Mode Comparison Logic ---
export const runBattleSimulation = async (brandA: BrandDNA, brandB: BrandDNA): Promise<BattleReport> => {
    const contextA = { name: brandA.name, mission: brandA.mission, tone: brandA.toneOfVoice, strengths: brandA.swot.strengths };
    const contextB = { name: brandB.name, mission: brandB.mission, tone: brandB.toneOfVoice, strengths: brandB.swot.strengths };

    const systemPrompt = "You are a ruthless Market Analyst conducting a head-to-head brand battle. Output strictly valid JSON.";
    const userPrompt = `
        COMPETITOR A: ${JSON.stringify(contextA)}
        COMPETITOR B: ${JSON.stringify(contextB)}

        Compare them on these metrics (Score 0-100):
        1. Innovation
        2. Visual Distinctiveness
        3. Tone Consistency
        4. Market Relevance
        5. Clarity of Message

        Structure:
        {
            "winner": "A" or "B" or "Tie",
            "summary": "Short paragraph summary of the battle.",
            "metrics": [
                { "subject": "Innovation", "A": 80, "B": 60, "fullMark": 100 },
                ... (repeat for all 5)
            ],
            "gapAnalysis": "Where can Brand A attack Brand B? (Blue Ocean Strategy)",
            "visualCritique": "Critique the hypothetical visual clash."
        }
    `;

    try {
        const resultText = await retryWithBackoff(() => universalGenerate(userPrompt, systemPrompt, [], true));
        let jsonStr = resultText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Battle Gen Error", e);
        throw e;
    }
}

// --- Image Generation Router ---

export const generateAssetImage = async (imagePrompt: string, dnaStyle: string): Promise<string | undefined> => {
    const settings = getSettings();
    const provider = settings.activeImageGen;
    const config = settings.image[provider];

    if (!config || !config.enabled) return undefined;

    const finalPrompt = `${imagePrompt}. Style: ${dnaStyle}. High quality, professional marketing image.`;

    try {
        // 1. Google Gemini (Imagen)
        if (provider === 'google') {
            // ALWAYS use process.env.API_KEY as per guidelines
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const resp = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: finalPrompt }] }
            });
            for (const part of resp.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        // 2. OpenAI DALL-E 3
        if (provider === 'openai') {
            const apiKey = config.apiKey || settings.llms.openai.apiKey;
            const resp = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: finalPrompt,
                    n: 1,
                    size: "1024x1024",
                    response_format: "b64_json"
                })
            });
            const data = await resp.json();
            if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
        }

        // 3. Stability AI
        if (provider === 'stability') {
            const formData = new FormData();
            formData.append('prompt', finalPrompt);
            formData.append('output_format', 'png');
            if (config.stylePreset) formData.append('style_preset', config.stylePreset);

            const resp = await fetch(`https://api.stability.ai/v2beta/stable-image/generate/core`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Accept': 'application/json' },
                body: formData
            });
            
            if(resp.ok) {
                const data = await resp.json();
                return `data:image/png;base64,${data.image}`;
            }
        }

        // 4. Fal.ai (Flux)
        if (provider === 'fal_flux') {
             const resp = await fetch("https://fal.run/fal-ai/flux/dev", {
                method: "POST",
                headers: { "Authorization": `Key ${config.apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt, image_size: "square_hd" }),
            });
            const data = await resp.json();
            // Fal usually returns a URL, not b64. React app needs b64 or accessible URL.
            // If URL, return it directly.
            if (data.images?.[0]?.url) return data.images[0].url;
        }

        return undefined;
    } catch (error) {
        console.error("Image Gen Error:", error);
        return undefined;
    }
};

// --- Veo Video Generation ---
export const generateVeoVideo = async (prompt: string, imageBase64?: string): Promise<string | undefined> => {
    // Check for selected API key as per Veo guidelines
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
    }
    
    // ALWAYS use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // Prepare payload
        const config = {
            numberOfVideos: 1,
            resolution: '720p' as const,
            aspectRatio: '16:9' as const
        };
        
        let operation;
        
        if (imageBase64) {
            // Image-to-Video
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                image: {
                    imageBytes: imageBase64.split(',')[1],
                    mimeType: 'image/png'
                },
                config
            });
        } else {
            // Text-to-Video
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config
            });
        }

        // Poll
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            // Veo returns a URI that needs the API key appended
            return `${videoUri}&key=${process.env.API_KEY}`;
        }
        return undefined;

    } catch (error) {
        console.error("Veo Error:", error);
        return undefined;
    }
};

// --- Agent/Chat Wrappers ---

export const createBrandChat = (dna: BrandDNA): Chat => {
    // ALWAYS use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are ${dna.name}. Brand Persona: ${dna.brandPersonality.join(', ')}. Tone: ${dna.toneOfVoice.description}.`;
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction }
    });
};

export const createAgentChat = (systemInstruction: string): Chat => {
    // ALWAYS use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction }
    });
};

export const generateAgentSystemPrompt = (dna: BrandDNA, role: AgentRole, guardrails: AgentGuardrails): string => {
    // Keep existing logic, it's just string manipulation
    const roleDescriptions = {
        'support': `You are "Support Sentinel", a customer support agent for ${dna.name}.`,
        'sales': `You are "Growth Engine", a sales representative for ${dna.name}.`,
        'content_guardian': `You are "Brand Guardian", a content editor for ${dna.name}.`,
        'creative_director': `You are "The Muse", a creative director for ${dna.name}.`
    };

    let basePrompt = `
    ${roleDescriptions[role]}
    BRAND DNA PROFILE:
    - **Mission:** ${dna.mission}
    - **Tone of Voice:** ${dna.toneOfVoice.adjectives.join(', ')}. ${dna.toneOfVoice.description}
    - **Key Messaging:** ${dna.keyMessaging.join(' | ')}
    `;

    if (guardrails.forbiddenTopics.length > 0) basePrompt += `\n- **FORBIDDEN TOPICS:** ${guardrails.forbiddenTopics.join(', ')}.`;
    return basePrompt;
};
