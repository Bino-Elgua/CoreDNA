/**
 * Advanced Web Scraper Service
 * Combines real HTML/CSS/content extraction with LLM analysis for accurate brand DNA
 * 
 * Features:
 * - Full HTML structure extraction
 * - CSS color palette detection
 * - Font family extraction
 * - Content analysis (messaging, tone, keywords)
 * - Image asset collection
 * - Metadata extraction (OG tags, structured data)
 * - Social links detection
 */

interface ScraperResult {
  html: string;
  text: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    ogTitle?: string;
    twitterImage?: string;
  };
  styling: {
    colors: ColorInfo[];
    fonts: FontInfo[];
    cssVariables: Record<string, string>;
  };
  content: {
    headings: string[];
    keyPhrases: string[];
    messaging: string[];
    callToActions: string[];
  };
  assets: {
    logos: string[];
    heroImages: string[];
    icons: string[];
  };
  social: {
    links: SocialLink[];
  };
}

interface ColorInfo {
  hex: string;
  rgb: string;
  name: string;
  frequency: number;
  context: string;
}

interface FontInfo {
  family: string;
  weights: string[];
  usage: string;
  cssSource: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

class AdvancedScraperService {
  /**
   * Fetch and parse website content
   * Uses CORS proxy for cross-origin requests
   */
  async fetchWebsite(url: string): Promise<Document> {
    console.log('[AdvancedScraper] Fetching:', url);
    try {
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = `${corsProxy}${url}`;
      console.log('[AdvancedScraper] Using CORS proxy:', targetUrl);
      
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (!response.ok) {
        // Fallback: try direct fetch
        const directResponse = await fetch(url);
        const html = await directResponse.text();
        return this.parseHTML(html);
      }
      
      const html = await response.text();
      return this.parseHTML(html);
    } catch (error) {
      console.warn('[AdvancedScraper] Fetch failed, attempting direct:', error);
      // Final fallback - fetch directly (may fail due to CORS)
      const response = await fetch(url);
      const html = await response.text();
      return this.parseHTML(html);
    }
  }

  /**
   * Parse HTML string into DOM
   */
  private parseHTML(html: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  /**
   * Extract complete styling information
   */
  private extractStyling(doc: Document, html: string): ScraperResult['styling'] {
    const colors: ColorInfo[] = [];
    const fonts: FontInfo[] = [];
    const cssVariables: Record<string, string> = {};

    // Extract CSS custom properties
    const styleSheets = doc.querySelectorAll('style');
    styleSheets.forEach((style) => {
      const cssText = style.textContent || '';
      
      // Find CSS variables
      const varMatches = cssText.matchAll(/--[\w-]+\s*:\s*([^;]+)/g);
      for (const match of varMatches) {
        const varName = match[0].split(':')[0].trim();
        const varValue = match[1].trim();
        cssVariables[varName] = varValue;
        
        // Extract hex colors
        const hexMatch = varValue.match(/#[0-9A-Fa-f]{6}/);
        if (hexMatch) {
          colors.push({
            hex: hexMatch[0],
            rgb: this.hexToRgb(hexMatch[0]),
            name: this.colorNameFromHex(hexMatch[0]),
            frequency: 0,
            context: `CSS variable: ${varName}`,
          });
        }
      }
    });

    // Extract font-family declarations
    const fontMatches = html.matchAll(/font-family\s*:\s*([^;]+)/gi);
    const fontFamilies = new Set<string>();
    
    for (const match of fontMatches) {
      const fontFamily = match[1].trim().replace(/['"];/g, '');
      fontFamilies.add(fontFamily);
    }

    fontFamilies.forEach((family) => {
      fonts.push({
        family,
        weights: this.detectFontWeights(html, family),
        usage: this.inferFontUsage(html, family),
        cssSource: 'Detected from CSS',
      });
    });

    // Extract colors from inline styles
    doc.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const colorMatches = style.matchAll(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/gi);
      
      for (const match of colorMatches) {
        const colorHex = match[0].startsWith('#')
          ? match[0]
          : this.rgbToHex(match[0]);
        
        const existing = colors.find((c) => c.hex === colorHex);
        if (existing) {
          existing.frequency++;
        } else {
          colors.push({
            hex: colorHex,
            rgb: match[0],
            name: this.colorNameFromHex(colorHex),
            frequency: 1,
            context: el.tagName.toLowerCase(),
          });
        }
      }
    });

    // Sort by frequency
    colors.sort((a, b) => b.frequency - a.frequency);

    return { colors: colors.slice(0, 10), fonts, cssVariables };
  }

  /**
   * Extract content and messaging
   */
  private extractContent(doc: Document): ScraperResult['content'] {
    const headings: string[] = [];
    const keyPhrases: string[] = [];
    const messaging: string[] = [];
    const callToActions: string[] = [];

    // Extract all headings
    ['h1', 'h2', 'h3'].forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 5) {
          headings.push(text);
        }
      });
    });

    // Extract meta descriptions and text sections
    const mainContent = doc.querySelectorAll('p, section, article, main');
    mainContent.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 20 && text.length < 300) {
        messaging.push(text);
      }
    });

    // Detect CTAs
    doc.querySelectorAll('button, a[role="button"], [class*="cta"], [class*="button"]')
      .forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length < 50) {
          callToActions.push(text);
        }
      });

    // Extract key phrases (common terms)
    const allText = doc.body.textContent || '';
    keyPhrases.push(
      ...this.extractKeyPhrases(allText).slice(0, 10)
    );

    return {
      headings: headings.slice(0, 5),
      keyPhrases: [...new Set(keyPhrases)].slice(0, 8),
      messaging: messaging.slice(0, 5),
      callToActions: [...new Set(callToActions)].slice(0, 4),
    };
  }

  /**
   * Extract assets (images, logos, icons)
   */
  private extractAssets(doc: Document, baseUrl: string): ScraperResult['assets'] {
    const logos: string[] = [];
    const heroImages: string[] = [];
    const icons: string[] = [];

    // Find logo images
    doc.querySelectorAll('img[alt*="logo"], img[class*="logo"], svg').forEach((el) => {
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      if (src && (src.includes('logo') || src.includes('brand'))) {
        logos.push(this.normalizeUrl(src, baseUrl));
      }
    });

    // Find hero/featured images
    doc.querySelectorAll('img[class*="hero"], img[class*="banner"], picture img').forEach((el) => {
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      if (src && heroImages.length < 3) {
        heroImages.push(this.normalizeUrl(src, baseUrl));
      }
    });

    // Find small icons (SVG/small images)
    doc.querySelectorAll('svg, img[width*="32"], img[width*="24"]').forEach((el) => {
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      if (src && src.includes('icon')) {
        icons.push(this.normalizeUrl(src, baseUrl));
      }
    });

    return { logos, heroImages, icons };
  }

  /**
   * Extract social media links
   */
  private extractSocial(doc: Document): ScraperResult['social'] {
    const links: SocialLink[] = [];
    const platforms = [
      'facebook',
      'twitter',
      'instagram',
      'linkedin',
      'youtube',
      'tiktok',
    ];

    doc.querySelectorAll('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="youtube.com"], a[href*="tiktok.com"]')
      .forEach((el) => {
        const href = el.getAttribute('href') || '';
        const platform = platforms.find((p) => href.includes(p));
        
        if (platform && !links.find((l) => l.url === href)) {
          links.push({ platform, url: href });
        }
      });

    return { links };
  }

  /**
   * Main scraping method
   */
  async scrape(url: string): Promise<ScraperResult> {
    try {
      const doc = await this.fetchWebsite(url);
      const html = doc.documentElement.outerHTML;
      const text = doc.body.textContent || '';

      // Extract metadata
      const metadata = {
        title:
          doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
          doc.querySelector('title')?.textContent ||
          '',
        description:
          doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
          doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
          '',
        keywords: (
          doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
        ).split(','),
        ogImage:
          doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        ogTitle:
          doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        twitterImage:
          doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
      };

      return {
        html: html.substring(0, 50000), // Limit HTML size for LLM
        text: text.substring(0, 10000), // Limit text
        metadata,
        styling: this.extractStyling(doc, html),
        content: this.extractContent(doc),
        assets: this.extractAssets(doc, url),
        social: this.extractSocial(doc),
      };
    } catch (error) {
      console.error('[AdvancedScraper] Error:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgb(0,0,0)';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    return (
      '#' +
      [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  private colorNameFromHex(hex: string): string {
    const colors: Record<string, string> = {
      '#FF0000': 'Red',
      '#00FF00': 'Green',
      '#0000FF': 'Blue',
      '#FFFF00': 'Yellow',
      '#FF00FF': 'Magenta',
      '#00FFFF': 'Cyan',
      '#FFA500': 'Orange',
      '#800080': 'Purple',
      '#000000': 'Black',
      '#FFFFFF': 'White',
      '#808080': 'Gray',
    };
    return colors[hex.toUpperCase()] || `Color ${hex}`;
  }

  private detectFontWeights(html: string, family: string): string[] {
    const weights = new Set<string>();
    const regex = new RegExp(`font-family\\s*:\\s*${family}[^}]*font-weight\\s*:\\s*(\\d+)`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      weights.add(match[1]);
    }
    return Array.from(weights);
  }

  private inferFontUsage(html: string, family: string): string {
    if (html.match(new RegExp(`h[1-3][^}]*font-family\\s*:\\s*${family}`, 'i'))) {
      return 'Headlines';
    }
    if (html.match(new RegExp(`body[^}]*font-family\\s*:\\s*${family}`, 'i'))) {
      return 'Body text';
    }
    return 'Multi-purpose';
  }

  private extractKeyPhrases(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    ]);

    const phrases = words.filter(
      (w) => !commonWords.has(w) && w.length > 3
    );

    // Count frequency
    const frequency: Record<string, number> = {};
    phrases.forEach((p) => {
      frequency[p] = (frequency[p] || 0) + 1;
    });

    return Object.entries(frequency)
      .filter(([_, count]) => count > 2)
      .sort(([, a], [, b]) => b - a)
      .map(([phrase]) => phrase);
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        return `${base.origin}${url}`;
      } catch {
        return url;
      }
    }
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }
}

export const advancedScraperService = new AdvancedScraperService();
export type { ScraperResult, ColorInfo, FontInfo, SocialLink };
