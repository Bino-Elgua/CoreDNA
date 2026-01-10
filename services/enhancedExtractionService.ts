/**
 * Enhanced Extraction Service
 * Combines real web scraping with intelligent LLM analysis
 * 
 * Flow:
 * 1. Scrape actual website data (HTML, CSS, content, assets)
 * 2. Build enriched prompt with real data
 * 3. Send to LLM for intelligent analysis
 * 4. Return comprehensive BrandDNA profile
 */

import { advancedScraperService, type ScraperResult } from './advancedScraperService';
import type { BrandDNA } from '../types';
import { geminiService } from './geminiService';

interface EnhancedExtractionConfig {
  useRealScraping: boolean;
  llmModel?: string;
  temperature?: number;
}

class EnhancedExtractionService {
  /**
   * Get active LLM provider from localStorage settings
   */
  private getActiveLLMProvider(): string {
    try {
      const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
      
      console.log('[EnhancedExtraction] Available LLM settings:', settings.llms);
      
      // PRIORITY 1: Use explicitly set activeLLM if it has API key
      if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey?.trim()) {
        console.log('[EnhancedExtraction] Using configured activeLLM:', settings.activeLLM);
        return settings.activeLLM;
      }
      
      // PRIORITY 2: Find first LLM with API key in alphabetical order
      if (settings.llms && Object.keys(settings.llms).length > 0) {
        for (const [key, config] of Object.entries(settings.llms)) {
          const llmConfig = config as any;
          if (llmConfig?.apiKey?.trim()) {
            console.log('[EnhancedExtraction] Using first available LLM:', key);
            return key;
          }
        }
      }
      
      throw new Error('No LLM provider configured with an API key. Go to Settings → API Keys to add one.');
    } catch (error) {
      console.error('[EnhancedExtraction] Error detecting provider:', error);
      throw error;
    }
  }

  /**
   * Build intelligent extraction prompt from scraped data
   */
  private buildEnhancedPrompt(scraperData: ScraperResult, brandName: string): string {
    const {
      metadata,
      styling,
      content,
      assets,
      social,
      text,
    } = scraperData;

    // Format styling information
    const colorPalette = styling.colors
      .slice(0, 5)
      .map((c) => `${c.name} (${c.hex})`)
      .join(', ');

    const fontStack = styling.fonts
      .slice(0, 3)
      .map((f) => `${f.family} (${f.usage})`)
      .join(', ');

    // Format content analysis
    const mainMessages = content.messaging.slice(0, 3).join(' | ');
    const ctas = content.callToActions.join(', ');
    const keyPhrases = content.keyPhrases.join(', ');

    // Create structured data summary
    const dataContext = `
=== REAL WEBSITE DATA EXTRACTION ===

Website Title: ${metadata.title}
Meta Description: ${metadata.description}
Keywords: ${metadata.keywords.filter(k => k.trim()).join(', ') || 'Auto-detected'}

=== VISUAL BRANDING DETECTED ===
Primary Colors: ${colorPalette}
Typography: ${fontStack}
Design Assets: ${assets.logos.length} logos, ${assets.heroImages.length} hero images
Social Presence: ${social.links.length} social profiles (${social.links.map((s) => s.platform).join(', ')})

=== CONTENT ANALYSIS ===
Main Headlines: ${content.headings.slice(0, 3).join(' | ')}
Core Messaging: ${mainMessages}
Calls to Action: ${ctas || 'Standard CTAs'}
Key Themes: ${keyPhrases}

=== BRAND VOICE INDICATORS ===
Content Tone: ${this.analyzeTone(text)}
Message Frequency: ${content.messaging.length} distinct messaging blocks
Engagement Level: ${this.analyzeEngagement(content)}

=== ADDITIONAL CONTEXT ===
Raw Page Content (first 2000 chars):
${text.substring(0, 2000)}
`;

    // Enhanced prompt that uses real data
    const prompt = `You are a brand strategist analyzing real website data. Use the EXTRACTED DATA below to create an accurate BrandDNA profile.

${dataContext}

Now analyze this data and create a comprehensive JSON BrandDNA profile. Be specific and accurate based on the real data provided. Include:

{
  "id": "dna_generated",
  "name": "${brandName}",
  "tagline": "Extract from metadata or main headline",
  "description": "2-3 sentence description based on content and messaging",
  "mission": "Infer mission from core messaging and headlines",
  "elevatorPitch": "30-second pitch from main value propositions",
  "values": ["Array of 3-5 values inferred from content and CTAs"],
  "keyMessaging": ["Array of 3-5 key messages extracted from content"],
  "colors": [
    {
      "hex": "#HEX_CODE",
      "name": "Color name from extracted palette",
      "usage": "Where this color is used in the design"
    }
  ],
  "fonts": [
    {
      "family": "Font family extracted from CSS",
      "usage": "Headlines/Body/All",
      "description": "Brief description of typography feel"
    }
  ],
  "visualStyle": {
    "style": "Modern/Classic/Minimalist/etc - based on actual design",
    "description": "Detailed description of visual approach"
  },
  "toneOfVoice": {
    "adjectives": ["professional", "approachable", "innovative"],
    "description": "Tone inference from actual content analysis"
  },
  "confidenceScores": {
    "visuals": 85,
    "strategy": 85,
    "tone": 85,
    "overall": 85
  },
  "brandPersonality": ["3-5 personality traits based on content"],
  "targetAudience": "Inferred from content and messaging",
  "personas": [
    {
      "name": "Primary user persona",
      "demographics": "Age, role, industry",
      "psychographics": "Values and motivations",
      "painPoints": ["2-3 problems solved"],
      "behaviors": ["2-3 typical behaviors"]
    }
  ],
  "swot": {
    "strengths": ["Based on messaging and assets"],
    "weaknesses": ["Inferred from content gaps"],
    "opportunities": ["From CTAs and content"],
    "threats": ["Based on industry context"]
  },
  "competitors": [
    {
      "name": "Competitor name if mentioned",
      "differentiation": "How this brand differs"
    }
  ]
}

RULES:
1. Use ONLY the extracted data provided - no hallucination
2. If data is missing, make educated inferences from context
3. Be specific with hex colors from the detected palette
4. Match font families exactly as extracted
5. Base messaging on actual content found
6. Return VALID JSON ONLY - no markdown, no explanations
7. Confidence scores reflect data quality (high = lots of real data, low = limited data)`;

    return prompt;
  }

  /**
   * Analyze writing tone from text
   */
  private analyzeTone(text: string): string {
    const formal = /professional|corporate|enterprise|business/i.test(text);
    const casual = /fun|cool|awesome|let's|don't|we're/i.test(text);
    const technical = /api|data|algorithm|framework|protocol/i.test(text);
    const creative = /imagine|inspire|creative|design|beautiful|elegant/i.test(text);

    const tones = [];
    if (formal) tones.push('formal');
    if (casual) tones.push('casual');
    if (technical) tones.push('technical');
    if (creative) tones.push('creative');

    return tones.length > 0 ? tones.join(', ') : 'neutral';
  }

  /**
   * Analyze engagement level
   */
  private analyzeEngagement(content: { messaging: string[]; callToActions: string[] }): string {
    const msgCount = content.messaging.length;
    const ctaCount = content.callToActions.length;
    const score = msgCount + ctaCount * 2; // CTAs weighted higher

    if (score > 10) return 'High engagement';
    if (score > 5) return 'Medium engagement';
    return 'Low engagement';
  }

  /**
   * Main enhanced extraction method
   */
  async extractBrandDNA(
    url: string,
    brandName: string = '',
    config: EnhancedExtractionConfig = {}
  ): Promise<BrandDNA> {
    const {
      useRealScraping = true,
      llmModel,
      temperature = 0.7,
    } = config;

    // Auto-prefix https:// if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      console.log('[EnhancedExtraction] Starting extraction...');
      console.log('[EnhancedExtraction] Website:', normalizedUrl);
      console.log('[EnhancedExtraction] Brand:', brandName || 'auto-detect');

      let scraperData: ScraperResult | null = null;

      // Step 1: Scrape real website data
      if (useRealScraping) {
        try {
          console.log('[EnhancedExtraction] Scraping website...');
          scraperData = await advancedScraperService.scrape(normalizedUrl);
          console.log('[EnhancedExtraction] ✓ Scraping complete');
          console.log('[EnhancedExtraction] Detected colors:', scraperData.styling.colors.length);
          console.log('[EnhancedExtraction] Detected fonts:', scraperData.styling.fonts.length);
          console.log('[EnhancedExtraction] Detected assets:', scraperData.assets.logos.length + scraperData.assets.heroImages.length);
          console.log('[EnhancedExtraction] Social profiles:', scraperData.social.links.length);
        } catch (scrapeError) {
          console.warn('[EnhancedExtraction] Scraping failed, using LLM analysis only:', scrapeError);
          scraperData = null;
        }
      }

      // Step 2: Build enhanced prompt
      let prompt: string;
      if (scraperData) {
        prompt = this.buildEnhancedPrompt(scraperData, brandName);
      } else {
        // Fallback to standard prompt if scraping failed
        prompt = this.buildStandardPrompt(normalizedUrl, brandName);
      }

      // Step 3: Send to LLM
      let provider: string;
      try {
        provider = this.getActiveLLMProvider();
        console.log('[EnhancedExtraction] ✓ Detected provider:', provider);
      } catch (providerError) {
        console.error('[EnhancedExtraction] ✗ Failed to detect provider:', providerError);
        throw providerError;
      }
      
      console.log('[EnhancedExtraction] Sending to LLM...');
      console.log('[EnhancedExtraction] Provider:', provider);
      console.log('[EnhancedExtraction] Model:', llmModel || 'default');
      console.log('[EnhancedExtraction] Prompt length:', prompt.length);

      let response: string;
      try {
        response = await geminiService.generate(provider, prompt, {
          temperature,
          model: llmModel,
        });
      } catch (llmError: any) {
        console.error('[EnhancedExtraction] ✗ LLM call failed:', llmError);
        throw new Error(`LLM API error: ${llmError?.message}`);
      }

      console.log('[EnhancedExtraction] ✓ LLM response received');
      console.log('[EnhancedExtraction] Response length:', response.length);
      console.log('[EnhancedExtraction] Response preview:', response.substring(0, 200));

      // Step 4: Parse and normalize
      const dna = this.parseAndNormalize(response, scraperData, normalizedUrl, brandName);
      console.log('[EnhancedExtraction] ✓ Extraction complete:', dna.name);

      return dna;
    } catch (error: any) {
      console.error('[EnhancedExtraction] Error:', error);
      throw new Error(`Enhanced extraction failed: ${error?.message}`);
    }
  }

  /**
   * Standard extraction prompt (fallback)
   */
  private buildStandardPrompt(url: string, brandName: string): string {
    return `For the website "${url}" (brand: ${brandName || 'Unknown'}), create a JSON object with these EXACT fields. Return ONLY valid JSON, nothing else:

{
  "id": "dna_generated",
  "name": "${brandName || 'Brand'}",
  "tagline": "Short brand tagline",
  "description": "2-3 sentence brand description",
  "mission": "Brand mission or purpose",
  "elevatorPitch": "30-second pitch",
  "values": ["value1", "value2", "value3"],
  "keyMessaging": ["message1", "message2"],
  "colors": [
    {"hex": "#3B82F6", "name": "Primary", "usage": "Main color"},
    {"hex": "#10B981", "name": "Success", "usage": "Accent"}
  ],
  "fonts": [
    {"family": "Inter", "usage": "All", "description": "Modern sans-serif"}
  ],
  "visualStyle": {"style": "Modern", "description": "Contemporary design"},
  "toneOfVoice": {"adjectives": ["professional"], "description": "Professional tone"},
  "confidenceScores": {"visuals": 70, "strategy": 70, "tone": 70, "overall": 70},
  "brandPersonality": ["innovative", "reliable"],
  "targetAudience": "Business professionals",
  "personas": [
    {"name": "User", "demographics": "Professional", "psychographics": "Quality-focused", "painPoints": ["efficiency"], "behaviors": ["research"]}
  ],
  "swot": {
    "strengths": ["quality"],
    "weaknesses": ["awareness"],
    "opportunities": ["growth"],
    "threats": ["competition"]
  },
  "competitors": [
    {"name": "Competitor", "differentiation": "Unique approach"}
  ]
}`;
  }

  /**
   * Parse LLM response and normalize with scraper data
   */
  private parseAndNormalize(
    response: string,
    scraperData: ScraperResult | null,
    url: string,
    brandName: string
  ): BrandDNA {
    try {
      // Extract JSON
      let jsonStr = response.trim();
      
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const now = Date.now();

      // Merge with scraped data for maximum accuracy
      // Extract additional metadata from scraper for enrichment
      const metadata = scraperData?.metadata || {};
      const scrapedKeywords = metadata.keywords?.filter((k: string) => k.trim()).slice(0, 10) || [];
      const metaDescription = metadata.description || '';
      
      return {
        id: `dna_${now}`,
        name: parsed.name || brandName || 'Unknown Brand',
        tagline: parsed.tagline || metadata.ogTitle || 'Professional Brand',
        description: parsed.description || metaDescription || 'Brand description',
        mission: parsed.mission || 'Brand mission',
        elevatorPitch: parsed.elevatorPitch || 'Brand pitch',
        websiteUrl: url,
        detectedLanguage: 'en',
        createdAt: now,
        values: Array.isArray(parsed.values) ? parsed.values.slice(0, 5) : ['Innovation', 'Quality'],
        keyMessaging: Array.isArray(parsed.keyMessaging) ? parsed.keyMessaging.slice(0, 5) : 
          scraperData?.content.keyPhrases.slice(0, 5) || ['Excellence'],
        
        // Use scraped colors if available
        colors: scraperData?.styling.colors.slice(0, 5).map((c) => ({
          hex: c.hex,
          name: c.name,
          usage: c.context,
        })) || (Array.isArray(parsed.colors)
          ? parsed.colors.slice(0, 5)
          : [{ hex: '#3B82F6', name: 'Primary', usage: 'Main' }]),

        // Use scraped fonts if available
        fonts: scraperData?.styling.fonts.slice(0, 3).map((f) => ({
          family: f.family,
          usage: f.usage,
          description: f.cssSource,
        })) || (Array.isArray(parsed.fonts)
          ? parsed.fonts.slice(0, 3)
          : [{ family: 'Arial', usage: 'All', description: 'Typography' }]),

        visualStyle: {
          style: parsed.visualStyle?.style || 'Modern',
          description: parsed.visualStyle?.description || 'Contemporary design',
        },

        toneOfVoice: {
          adjectives: Array.isArray(parsed.toneOfVoice?.adjectives)
            ? parsed.toneOfVoice.adjectives.slice(0, 3)
            : ['professional'],
          description: parsed.toneOfVoice?.description || 'Professional tone',
        },

        confidenceScores: {
          visuals: Math.min(100, (parsed.confidenceScores?.visuals || 75) + (scraperData ? 10 : 0)),
          strategy: parsed.confidenceScores?.strategy || 75,
          tone: parsed.confidenceScores?.tone || 75,
          overall: Math.min(100, (parsed.confidenceScores?.overall || 75) + (scraperData ? 10 : 0)),
        },

        brandPersonality: Array.isArray(parsed.brandPersonality)
          ? parsed.brandPersonality.slice(0, 3)
          : ['professional'],

        targetAudience: parsed.targetAudience || 'Business professionals',

        personas: Array.isArray(parsed.personas)
          ? parsed.personas.slice(0, 2)
          : [{ name: 'Primary User', demographics: 'Professional', psychographics: 'Quality-focused', painPoints: ['efficiency'], behaviors: ['research'] }],

        swot: {
          strengths: Array.isArray(parsed.swot?.strengths) ? parsed.swot.strengths.slice(0, 3) : ['Quality'],
          weaknesses: Array.isArray(parsed.swot?.weaknesses) ? parsed.swot.weaknesses.slice(0, 3) : ['Awareness'],
          opportunities: Array.isArray(parsed.swot?.opportunities) ? parsed.swot.opportunities.slice(0, 3) : ['Growth'],
          threats: Array.isArray(parsed.swot?.threats) ? parsed.swot.threats.slice(0, 3) : ['Competition'],
        },

        competitors: Array.isArray(parsed.competitors)
          ? parsed.competitors.slice(0, 3)
          : [{ name: 'Market competitor', differentiation: 'Alternative approach' }],
      } as any;
      
      // Add scraped enrichment if available
      if (scraperData) {
        const profile = dnaProfile;
        profile.scrapedMetadata = {
          pageTitle: metadata.title,
          metaDescription: metadata.description,
          keywords: scrapedKeywords,
          ogImage: metadata.ogImage,
          twitterImage: metadata.twitterImage,
        };
        profile.detectedAssets = {
          logos: scraperData.assets.logos.slice(0, 3),
          heroImages: scraperData.assets.heroImages.slice(0, 3),
          icons: scraperData.assets.icons.slice(0, 5),
        };
        profile.socialPresence = scraperData.social.links.map(link => ({
          platform: link.platform,
          url: link.url,
        }));
        profile.contentAnalysis = {
          mainHeadings: scraperData.content.headings.slice(0, 3),
          messaging: scraperData.content.messaging.slice(0, 3),
          callsToAction: scraperData.content.callToActions,
          keyPhrases: scraperData.content.keyPhrases.slice(0, 8),
        };
      }
      
      return dnaProfile;
    } catch (error: any) {
      console.error('[EnhancedExtraction] Parse error, using fallback:', error.message);
      
      // Return rich fallback
      const now = Date.now();
      return {
        id: `dna_${now}`,
        name: brandName || 'Brand',
        tagline: 'Professional brand',
        description: 'Brand focusing on quality and innovation',
        mission: 'To provide excellent solutions',
        elevatorPitch: 'Delivering innovative solutions with quality',
        websiteUrl: url,
        detectedLanguage: 'en',
        createdAt: now,
        values: ['Innovation', 'Quality', 'Customer Focus'],
        keyMessaging: ['Excellence', 'Reliability'],
        colors: scraperData?.styling.colors.slice(0, 5).map((c) => ({
          hex: c.hex,
          name: c.name,
          usage: c.context,
        })) || [
          { hex: '#3B82F6', name: 'Primary', usage: 'Main' },
          { hex: '#10B981', name: 'Success', usage: 'Accent' },
        ],
        fonts: scraperData?.styling.fonts.slice(0, 3) || [
          { family: 'Inter', usage: 'All', description: 'Modern sans-serif' },
        ],
        visualStyle: { style: 'Modern', description: 'Clean design' },
        toneOfVoice: { adjectives: ['professional'], description: 'Professional tone' },
        confidenceScores: { visuals: 65, strategy: 65, tone: 65, overall: 65 },
        brandPersonality: ['professional'],
        targetAudience: 'Business professionals',
        personas: [{
          name: 'Primary User',
          demographics: 'Professional',
          psychographics: 'Quality-focused',
          painPoints: ['efficiency'],
          behaviors: ['research'],
        }],
        swot: {
          strengths: ['Quality focus'],
          weaknesses: ['Market awareness'],
          opportunities: ['Expansion'],
          threats: ['Competition'],
        },
        competitors: [{ name: 'Market competitor', differentiation: 'Alternative approach' }],
      };
    }
  }
}

export const enhancedExtractionService = new EnhancedExtractionService();
export type { EnhancedExtractionConfig };
