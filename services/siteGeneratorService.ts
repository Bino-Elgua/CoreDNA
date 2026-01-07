/**
 * Site Generator Service
 * Generates complete 5-page websites from BrandDNA
 * Integrates with Inference Engine for copy quality + RLM for long-form content
 */

import { BrandDNA, CampaignAsset, WebsiteData } from '../types';
import { universalGenerate } from './geminiService';
import rlmService from './rlmService';
import inferenceRouter from './inferenceRouter';

export interface GeneratedSite {
    id: string;
    dnaId: string;
    dnaName: string;
    title: string;
    description: string;
    pages: {
        home: SitePage;
        about: SitePage;
        services: SitePage;
        portfolio: SitePage;
        contact: SitePage;
        blog?: SitePage; // Hunter tier only
    };
    config: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        fonts: { heading: string; body: string };
        logoUrl?: string;
    };
    sonicConfig: {
        enabled: boolean;
        voiceEnabled: boolean;
        ttsProvider?: string;
        voiceType?: string;
    };
    generatedAt: number;
}

export interface SitePage {
    id: string;
    slug: string;
    title: string;
    metaDescription: string;
    content: {
        sections: PageSection[];
    };
}

export interface PageSection {
    id: string;
    type: 'hero' | 'about' | 'services-grid' | 'portfolio-grid' | 'cta' | 'contact-form' | 'footer' | 'blog-grid';
    headline?: string;
    subheadline?: string;
    content?: string;
    items?: SectionItem[];
    ctaText?: string;
    ctaLink?: string;
    imageUrl?: string;
    imagePrompt?: string;
    backgroundColor?: string;
    textColor?: string;
}

export interface SectionItem {
    id: string;
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string;
    link?: string;
    badge?: string;
}

class SiteGeneratorService {
    /**
     * Generate complete 5-page site structure from BrandDNA
     */
    async generateSite(
        dna: BrandDNA,
        campaignAssets?: CampaignAsset[],
        settings?: any,
        onProgress?: (step: string, progress: number) => void
    ): Promise<GeneratedSite> {
        const steps = [
            'Analyzing DNA',
            'Generating structure & copy',
            'Creating visuals',
            'Building pages',
            'Configuring Sonic Agent',
        ];

        const siteId = `site_${Date.now()}`;

        // Step 1: Analyze DNA (extract key elements)
        onProgress?.(steps[0], 10);
        const dnaAnalysis = await this.analyzeBrandDNA(dna, settings);

        // Step 2: Generate all page copy
        onProgress?.(steps[1], 25);
        const pages = await this.generateAllPages(dna, dnaAnalysis, settings);

        // Step 3: Generate visual assets
        onProgress?.(steps[2], 50);
        await this.generatePageVisuals(pages, dna);

        // Step 4: Build page structure
        onProgress?.(steps[3], 75);
        const sitConfig = this.buildSiteConfig(dna);

        // Step 5: Sonic Agent config
        onProgress?.(steps[4], 90);
        const sonicConfig = this.extractSonicConfig(dna, settings);

        const generatedSite: GeneratedSite = {
            id: siteId,
            dnaId: dna.id,
            dnaName: dna.name,
            title: pages.home.title,
            description: pages.home.metaDescription,
            pages,
            config: sitConfig,
            sonicConfig,
            generatedAt: Date.now(),
        };

        return generatedSite;
    }

    /**
     * Analyze brand DNA and extract key messaging
     */
    private async analyzeBrandDNA(dna: BrandDNA, settings?: any): Promise<any> {
        const prompt = `
Analyze this brand DNA and extract key messaging elements:

Brand: ${dna.name}
Mission: ${dna.mission}
Tagline: ${dna.tagline}
Target Audience: ${dna.targetAudience}
Personas: ${JSON.stringify(dna.personas.map(p => p.name))}
SWOT: ${JSON.stringify(dna.swot)}

Return a JSON object with:
{
    "heroValue": "Core value proposition (1 sentence)",
    "heroCTA": "Primary call-to-action button text",
    "aboutNarrative": "Brand story (2-3 sentences)",
    "servicesTitles": ["Service 1", "Service 2", "Service 3"],
    "servicesDescriptions": ["Description 1", "Description 2", "Description 3"],
    "portfolioTitle": "Portfolio section headline",
    "contactValue": "Contact/connection value prop"
}
`;

        try {
            const result = await universalGenerate(prompt, '', [], true);
            const parsed = JSON.parse(result);
            return parsed;
        } catch (e) {
            console.error('DNA Analysis failed:', e);
            return this.getDefaultDNAAnalysis(dna);
        }
    }

    /**
     * Generate all 5 pages with copy
     */
    private async generateAllPages(
        dna: BrandDNA,
        analysis: any,
        settings?: any
    ): Promise<GeneratedSite['pages']> {
        const homeTitle = analysis.heroValue || dna.mission;
        const homeDescription = dna.tagline || `${dna.name} | ${homeTitle}`;

        // Use RLM for long-form About copy if enabled
        let aboutContent = analysis.aboutNarrative || dna.description;
        if (settings?.rlm?.enabled) {
            try {
                const rlmResult = await rlmService.extractFullWebsiteDNA(
                    { aboutNarrative: analysis.aboutNarrative || dna.description },
                    dna,
                    settings.rlm
                );
                aboutContent = rlmResult.content || aboutContent;
            } catch (e) {
                console.warn('RLM About generation failed, using default', e);
            }
        }

        // Apply Inference Engine for headline/copy quality
        let heroCTA = analysis.heroValue;
        if (settings?.inference?.selfConsistency?.enabled) {
            try {
                heroCTA = await inferenceRouter.wrapLLMCall(
                    () => Promise.resolve(analysis.heroValue),
                    { prompt: `Hero headline for ${dna.name}`, task: 'site_generation', tier: 'pro' }
                );
            } catch (e) {
                console.warn('Inference failed, using default hero CTA');
            }
        }

        const pages: GeneratedSite['pages'] = {
            home: this.generateHomePage(dna, analysis, homeTitle, homeDescription),
            about: this.generateAboutPage(dna, aboutContent),
            services: this.generateServicesPage(dna, analysis),
            portfolio: this.generatePortfolioPage(dna),
            contact: this.generateContactPage(dna),
        };

        return pages;
    }

    /**
     * Generate Home page
     */
    private generateHomePage(
        dna: BrandDNA,
        analysis: any,
        title: string,
        metaDesc: string
    ): SitePage {
        const primaryColor = dna.colors[0]?.hex || '#000';
        const heroImagePrompt = dna.heroImagePrompt || 
            `Professional hero image for ${dna.name}, ${dna.visualStyle?.description}, high quality, modern`;

        return {
            id: 'home',
            slug: '/',
            title,
            metaDescription: metaDesc,
            content: {
                sections: [
                    {
                        id: 'hero',
                        type: 'hero',
                        headline: title,
                        subheadline: dna.tagline || analysis.heroValue,
                        ctaText: analysis.heroValue || 'Get Started',
                        ctaLink: '/contact',
                        imageUrl: dna.heroImageUrl,
                        imagePrompt: heroImagePrompt,
                        backgroundColor: '#fff',
                        textColor: dna.colors[1]?.hex || '#000',
                    },
                    {
                        id: 'features',
                        type: 'services-grid',
                        headline: 'Why Choose Us',
                        items: dna.swot?.strengths?.slice(0, 3).map((strength, i) => ({
                            id: `feature_${i}`,
                            title: strength.split('|')[0] || strength,
                            description: strength,
                            icon: '✨',
                        })) || [],
                    },
                    {
                        id: 'cta',
                        type: 'cta',
                        headline: 'Ready to Transform?',
                        ctaText: 'Schedule a Consultation',
                        ctaLink: '/contact',
                        backgroundColor: primaryColor,
                    },
                ],
            },
        };
    }

    /**
     * Generate About page
     */
    private generateAboutPage(dna: BrandDNA, narrative: string): SitePage {
        return {
            id: 'about',
            slug: '/about',
            title: `About ${dna.name}`,
            metaDescription: `Learn about ${dna.name}'s mission, values, and impact.`,
            content: {
                sections: [
                    {
                        id: 'about-hero',
                        type: 'about',
                        headline: `About ${dna.name}`,
                        content: narrative || dna.description,
                    },
                    {
                        id: 'values',
                        type: 'services-grid',
                        headline: 'Our Values',
                        items: dna.values.slice(0, 4).map((value, i) => ({
                            id: `value_${i}`,
                            title: value,
                            description: `Core value that drives our ${dna.name} mission`,
                            icon: '🎯',
                        })),
                    },
                ],
            },
        };
    }

    /**
     * Generate Services page
     */
    private generateServicesPage(dna: BrandDNA, analysis: any): SitePage {
        const services = analysis.servicesTitles || dna.swot?.strengths?.slice(0, 6) || [];
        const descriptions = analysis.servicesDescriptions || [];

        return {
            id: 'services',
            slug: '/services',
            title: `${dna.name} Services`,
            metaDescription: `Explore our comprehensive service offerings.`,
            content: {
                sections: [
                    {
                        id: 'services-header',
                        type: 'services-grid',
                        headline: 'Our Services',
                        items: services.map((title: string, i: number) => ({
                            id: `service_${i}`,
                            title,
                            description: descriptions[i] || `Professional ${title.toLowerCase()} solution`,
                            icon: '⭐',
                        })),
                    },
                ],
            },
        };
    }

    /**
     * Generate Portfolio page
     */
    private generatePortfolioPage(dna: BrandDNA): SitePage {
        const portfolioItems = dna.competitors?.slice(0, 4).map((comp, i) => ({
            id: `portfolio_${i}`,
            title: `${comp.name} Case Study`,
            description: comp.differentiation,
            icon: '📊',
        })) || [];

        return {
            id: 'portfolio',
            slug: '/portfolio',
            title: `${dna.name} Portfolio`,
            metaDescription: `View our work and successful projects.`,
            content: {
                sections: [
                    {
                        id: 'portfolio-grid',
                        type: 'portfolio-grid',
                        headline: 'Our Work',
                        items: portfolioItems,
                    },
                ],
            },
        };
    }

    /**
     * Generate Contact page
     */
    private generateContactPage(dna: BrandDNA): SitePage {
        return {
            id: 'contact',
            slug: '/contact',
            title: `Contact ${dna.name}`,
            metaDescription: `Get in touch with ${dna.name}.`,
            content: {
                sections: [
                    {
                        id: 'contact-form',
                        type: 'contact-form',
                        headline: `Let's Connect`,
                        subheadline: `Have questions? We'd love to hear from you.`,
                    },
                    {
                        id: 'contact-info',
                        type: 'about',
                        content: `Email: info@${dna.name.toLowerCase().replace(/\s/g, '')}.com`,
                    },
                ],
            },
        };
    }

    /**
     * Generate visual assets for pages (images, etc.)
     */
    private async generatePageVisuals(pages: GeneratedSite['pages'], dna: BrandDNA): Promise<void> {
        // Image generation would happen here
        // For now, use existing DNA visuals
        const allPages = Object.values(pages);
        for (const page of allPages) {
            for (const section of page.content.sections) {
                if (section.imagePrompt && !section.imageUrl) {
                    // TODO: Call generateAssetImage() here
                    // section.imageUrl = await generateAssetImage(section.imagePrompt, ...);
                }
            }
        }
    }

    /**
     * Build site configuration (colors, fonts, etc.)
     */
    private buildSiteConfig(dna: BrandDNA): GeneratedSite['config'] {
        return {
            primaryColor: dna.colors[0]?.hex || '#000',
            secondaryColor: dna.colors[1]?.hex || '#333',
            accentColor: dna.colors[2]?.hex || '#666',
            fonts: {
                heading: dna.fonts[0]?.family || 'Inter',
                body: dna.fonts[1]?.family || 'Inter',
            },
            logoUrl: dna.visualIdentityExtended?.logoUrl,
        };
    }

    /**
     * Extract Sonic Agent configuration from Sonic Lab or DNA
     */
    private extractSonicConfig(dna: BrandDNA, settings?: any): GeneratedSite['sonicConfig'] {
        const sonicIdentity = dna.sonicIdentity;

        return {
            enabled: !settings?.website?.disableSonicAgent,
            voiceEnabled: !settings?.website?.disableVoiceMode && !!sonicIdentity,
            ttsProvider: settings?.activeVoice || 'elevenlabs',
            voiceType: sonicIdentity?.voiceType || 'professional',
        };
    }

    /**
     * Default DNA analysis fallback
     */
    private getDefaultDNAAnalysis(dna: BrandDNA): any {
        return {
            heroValue: dna.mission || dna.tagline || `Welcome to ${dna.name}`,
            heroCTA: 'Get Started',
            aboutNarrative: dna.description || `Discover what ${dna.name} is all about.`,
            servicesTitles: dna.swot?.strengths?.slice(0, 3) || ['Service 1', 'Service 2', 'Service 3'],
            servicesDescriptions: dna.swot?.strengths?.slice(0, 3) || ['Description 1', 'Description 2', 'Description 3'],
            portfolioTitle: 'Our Work',
            contactValue: `Connect with ${dna.name}`,
        };
    }
}

export const siteGeneratorService = new SiteGeneratorService();
