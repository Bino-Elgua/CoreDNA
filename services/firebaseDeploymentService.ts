/**
 * Firebase Deployment Service
 * Builds and deploys Next.js sites to Firebase Hosting
 */

import { GeneratedSite } from './siteGeneratorService';

export interface DeploymentConfig {
    firebaseProjectId: string;
    firebaseApiKey: string;
    firebaseStorageBucket: string;
}

export interface DeploymentResult {
    success: boolean;
    siteUrl: string;
    buildTime: number;
    deployedAt: number;
    error?: string;
}

class FirebaseDeploymentService {
    private apiUrl = '/api/deploy'; // Backend endpoint for Firebase deployment

    /**
     * Deploy generated site to Firebase Hosting
     */
    async deploySite(
        site: GeneratedSite,
        config: DeploymentConfig,
        onProgress?: (message: string, progress: number) => void
    ): Promise<DeploymentResult> {
        const startTime = Date.now();

        try {
            onProgress?.('Preparing deployment...', 10);

            // Step 1: Validate Firebase config
            if (!config.firebaseProjectId || !config.firebaseApiKey) {
                throw new Error('Firebase configuration missing. Please add keys in Settings > Website Options.');
            }

            onProgress?.('Building Next.js site...', 20);

            // Step 2: Build Next.js site structure
            const buildPayload = this.generateNextJsBuild(site);

            onProgress?.('Uploading to Firebase...', 50);

            // Step 3: Call backend to deploy
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    site,
                    config,
                    build: buildPayload,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Deployment failed');
            }

            const result = await response.json();

            onProgress?.('Finalizing deployment...', 90);

            const deploymentTime = Date.now() - startTime;

            return {
                success: true,
                siteUrl: result.siteUrl || `https://${site.id}.coredna.app`,
                buildTime: deploymentTime,
                deployedAt: Date.now(),
            };
        } catch (error: any) {
            return {
                success: false,
                siteUrl: '',
                buildTime: Date.now() - startTime,
                deployedAt: 0,
                error: error.message || 'Deployment failed',
            };
        }
    }

    /**
     * Generate complete Next.js site structure
     */
    private generateNextJsBuild(site: GeneratedSite): any {
        const pages = site.pages;

        // Build Next.js page files
        const pageFiles: Record<string, string> = {};

        // Home page
        pageFiles['pages/index.tsx'] = this.generatePageComponent(pages.home, site);

        // About page
        pageFiles['pages/about.tsx'] = this.generatePageComponent(pages.about, site);

        // Services page
        pageFiles['pages/services.tsx'] = this.generatePageComponent(pages.services, site);

        // Portfolio page
        pageFiles['pages/portfolio.tsx'] = this.generatePageComponent(pages.portfolio, site);

        // Contact page
        pageFiles['pages/contact.tsx'] = this.generatePageComponent(pages.contact, site);

        // Layout component
        pageFiles['components/Layout.tsx'] = this.generateLayoutComponent(site);

        // Sonic Agent widget (if enabled)
        if (site.sonicConfig.enabled) {
            pageFiles['components/SonicAgentWidget.tsx'] = this.generateSonicAgentComponent(site);
        }

        // Package.json
        pageFiles['package.json'] = JSON.stringify(this.generatePackageJson(site), null, 2);

        // Tailwind config
        pageFiles['tailwind.config.js'] = this.generateTailwindConfig(site);

        // Next.js config
        pageFiles['next.config.js'] = this.generateNextConfig();

        // tsconfig.json
        pageFiles['tsconfig.json'] = JSON.stringify(this.generateTsConfig(), null, 2);

        return {
            siteId: site.id,
            dnaName: site.dnaName,
            files: pageFiles,
            config: site.config,
        };
    }

    /**
     * Generate a page component
     */
    private generatePageComponent(page: any, site: GeneratedSite): string {
        const { primaryColor, secondaryColor, fonts } = site.config;

        let sectionsJsx = '';
        for (const section of page.content.sections) {
            if (section.type === 'hero') {
                sectionsJsx += `
    <section className="relative py-20 md:py-32 px-6 md:px-12" style={{ backgroundColor: '${page.content.sections[0]?.backgroundColor || '#fff'}' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ color: '${section.textColor || primaryColor}' }}>
            ${section.headline}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            ${section.subheadline}
          </p>
          <button
            className="px-8 py-4 rounded-lg font-bold text-white hover:opacity-90 transition-opacity shadow-lg"
            style={{ backgroundColor: '${primaryColor}' }}
          >
            ${section.ctaText || 'Get Started'}
          </button>
        </div>
        ${
          section.imageUrl
            ? `<div className="hidden md:block"><img src="${section.imageUrl}" alt="Hero" className="rounded-2xl shadow-2xl w-full" /></div>`
            : ''
        }
      </div>
    </section>`;
            } else if (section.type === 'services-grid') {
                sectionsJsx += `
    <section className="py-20 md:py-32 px-6 md:px-12 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">${section.headline}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          ${(section.items || [])
            .map(
              (item: any) => `
          <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">${item.icon || '✨'}</div>
            <h3 className="text-2xl font-bold mb-3">${item.title}</h3>
            <p className="text-gray-600 leading-relaxed">${item.description}</p>
          </div>`
            )
            .join('')}
        </div>
      </div>
    </section>`;
            } else if (section.type === 'contact-form') {
                sectionsJsx += `
    <section className="py-20 md:py-32 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">${section.headline}</h2>
        <p className="text-center text-gray-600 mb-12">${section.subheadline}</p>
        <form className="space-y-6">
          <input type="text" placeholder="Your Name" className="w-full px-6 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2" style={{ focusRingColor: '${primaryColor}' }} />
          <input type="email" placeholder="Your Email" className="w-full px-6 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2" style={{ focusRingColor: '${primaryColor}' }} />
          <textarea placeholder="Your Message" rows={5} className="w-full px-6 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2" style={{ focusRingColor: '${primaryColor}' }}></textarea>
          <button type="submit" className="w-full py-3 rounded-lg font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '${primaryColor}' }}>
            Send Message
          </button>
        </form>
      </div>
    </section>`;
            } else if (section.type === 'about') {
                sectionsJsx += `
    <section className="py-20 md:py-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-8">${section.headline}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">${section.content}</p>
      </div>
    </section>`;
            }
        }

        return `'use client';

import React from 'react';
import Layout from '../components/Layout';
import SonicAgentWidget from '../components/SonicAgentWidget';

export default function ${page.id.charAt(0).toUpperCase() + page.id.slice(1)}() {
  return (
    <Layout>
      <div className="w-full">
        ${sectionsJsx}
      </div>
      <SonicAgentWidget />
    </Layout>
  );
}`;
    }

    /**
     * Generate Layout component
     */
    private generateLayoutComponent(site: GeneratedSite): string {
        const { primaryColor, secondaryColor } = site.config;

        return `'use client';

import React from 'react';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white shadow-sm" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: '${primaryColor}' }}>${site.dnaName}</h1>
          <div className="flex gap-8">
            <Link href="/" className="font-medium hover:opacity-70 transition-opacity">Home</Link>
            <Link href="/about" className="font-medium hover:opacity-70 transition-opacity">About</Link>
            <Link href="/services" className="font-medium hover:opacity-70 transition-opacity">Services</Link>
            <Link href="/portfolio" className="font-medium hover:opacity-70 transition-opacity">Portfolio</Link>
            <Link href="/contact" className="font-medium hover:opacity-70 transition-opacity">Contact</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" style={{ backgroundColor: '${secondaryColor}' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; ${new Date().getFullYear()} ${site.dnaName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}`;
    }

    /**
     * Generate Sonic Agent Widget component
     */
    private generateSonicAgentComponent(site: GeneratedSite): string {
        return `'use client';

import React, { useState } from 'react';

export default function SonicAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi there! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    // TODO: Send to Sonic Agent API with BrandDNA context
    // const response = await fetch('/api/sonic-agent', {
    //   method: 'POST',
    //   body: JSON.stringify({ message: input, dnaId: '${site.dnaId}' })
    // });
  };

  return (
    <>
      {/* Sonic Widget Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white font-bold text-2xl z-40"
        style={{ backgroundColor: '${site.config.primaryColor}' }}
      >
        💬
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col z-40">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '${site.config.primaryColor}' }}>
            <h3 className="text-white font-bold">${site.dnaName} Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div
                  className={\`max-w-xs px-4 py-2 rounded-lg \${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }\`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
            />
            <button onClick={handleSend} className="px-4 py-2 rounded-lg text-white font-bold" style={{ backgroundColor: '${site.config.primaryColor}' }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}`;
    }

    /**
     * Generate package.json
     */
    private generatePackageJson(site: GeneratedSite): any {
        return {
            name: site.dnaName.toLowerCase().replace(/\s/g, '-'),
            version: '1.0.0',
            private: true,
            scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
                lint: 'next lint',
            },
            dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
                next: '^14.0.0',
            },
            devDependencies: {
                typescript: '^5.0.0',
                'tailwindcss': '^3.3.0',
                'postcss': '^8.4.0',
                'autoprefixer': '^10.4.0',
            },
        };
    }

    /**
     * Generate tailwind.config.js
     */
    private generateTailwindConfig(site: GeneratedSite): string {
        return `module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${site.config.primaryColor}',
        secondary: '${site.config.secondaryColor}',
        accent: '${site.config.accentColor}',
      },
      fontFamily: {
        heading: ['${site.config.fonts.heading}', 'sans-serif'],
        body: ['${site.config.fonts.body}', 'sans-serif'],
      },
    },
  },
  plugins: [],
};`;
    }

    /**
     * Generate next.config.js
     */
    private generateNextConfig(): string {
        return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;`;
    }

    /**
     * Generate tsconfig.json
     */
    private generateTsConfig(): any {
        return {
            compilerOptions: {
                target: 'ES2020',
                lib: ['ES2020', 'DOM', 'DOM.Iterable'],
                jsx: 'react-jsx',
                module: 'ESNext',
                moduleResolution: 'bundler',
                resolveJsonModule: true,
                allowImportingTsExtensions: true,
                strict: true,
            },
            include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
            exclude: ['node_modules'],
        };
    }
}

export const firebaseDeploymentService = new FirebaseDeploymentService();
