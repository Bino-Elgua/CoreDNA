
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, WebsiteData } from '../types';
import { generateWebsiteData, generateAssetImage } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

const TEMPLATES = [
    { id: 'saas', name: 'SaaS / Tech Startup', icon: '🚀' },
    { id: 'agency', name: 'Creative Agency', icon: '🎨' },
    { id: 'portfolio', name: 'Personal Portfolio', icon: '👤' },
    { id: 'ecommerce', name: 'Modern E-commerce', icon: '🛍️' },
];

const SiteBuilderPage: React.FC = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<BrandDNA[]>([]);
    const [selectedDnaId, setSelectedDnaId] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('saas');
    const [isBuilding, setIsBuilding] = useState(false);
    const [siteData, setSiteData] = useState<WebsiteData | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Load DNA profiles on mount
    useEffect(() => {
        const stored = localStorage.getItem('core_dna_profiles');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setProfiles(parsed);
                if (parsed.length > 0) setSelectedDnaId(parsed[0].id);
            } catch (e) {}
        }
    }, []);

    const selectedDna = profiles.find(p => p.id === selectedDnaId);

    const handleBuild = async () => {
        if (!selectedDna) return;
        setIsBuilding(true);
        setSiteData(null);

        try {
            // 1. Generate Structure & Copy
            const data = await generateWebsiteData(selectedDna, selectedTemplate);
            
            // 2. Generate Hero Image if needed
            // Ensure sections exists
            if (data.sections) {
                const heroSection = data.sections.find(s => s.type === 'hero');
                if (heroSection && heroSection.content.imagePrompt) {
                    const img = await generateAssetImage(heroSection.content.imagePrompt, selectedDna.visualStyle?.description || 'Modern website style');
                    if (img) heroSection.content.imageUrl = img;
                }
            }

            setSiteData(data);
        } catch (e) {
            console.error(e);
            alert("Failed to construct website. AI Architect is busy.");
        } finally {
            setIsBuilding(false);
        }
    };

    const handleExport = async () => {
        if (!siteData || !selectedDna) return;
        const zip = new JSZip();
        
        // Generate a simple React/Tailwind project structure
        const packageJson = {
            name: `${selectedDna.name.toLowerCase().replace(/\s/g, '-')}-site`,
            version: "1.0.0",
            dependencies: { "react": "^18.2.0", "react-dom": "^18.2.0" }
        };

        const indexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${siteData.title}</title>
    <meta name="description" content="${siteData.metaDescription}" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="font-sans antialiased text-gray-900 bg-white">
    <div id="root"></div>
    <!-- In a real export, we would bundle the React code. Here we provide the raw components. -->
    <script>document.getElementById('root').innerText = "Open src/App.jsx to see your generated code!";</script>
  </body>
</html>`;

        // We construct the App.jsx string based on siteData
        // Defensive check: sections might be undefined in edge cases
        const sections = siteData.sections || [];
        const appJsx = `
import React from 'react';

const Website = () => {
  return (
    <div className="min-h-screen">
      ${sections.map(s => {
          if (s.type === 'hero') {
              return `
      <section className="relative bg-gray-900 text-white py-20 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-5xl font-bold mb-6">${s.content.headline}</h1>
            <p className="text-xl mb-8 text-gray-300">${s.content.subheadline}</p>
            <button className="px-8 py-4 bg-[${selectedDna.colors[0]?.hex || '#3b82f6'}] rounded-full font-bold hover:opacity-90">
              ${s.content.ctaText}
            </button>
          </div>
          ${s.content.imageUrl ? `<div className="md:w-1/2"><img src="${s.content.imageUrl}" className="rounded-xl shadow-2xl" /></div>` : ''}
        </div>
      </section>`;
          }
          if (s.type === 'features') {
              return `
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">${s.content.headline}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${(s.content.items || []).map(i => `
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-2">${i.title}</h3>
              <p className="text-gray-600">${i.description}</p>
            </div>`).join('')}
          </div>
        </div>
      </section>`;
          }
          return ''; // Add other sections similarly
      }).join('\n')}
      
      <footer className="bg-gray-900 text-white py-12 text-center">
        <p>&copy; ${new Date().getFullYear()} ${selectedDna.name}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Website;
`;

        zip.file("package.json", JSON.stringify(packageJson, null, 2));
        zip.file("index.html", indexHtml);
        zip.file("src/App.jsx", appJsx);
        
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${selectedDna.name.replace(/\s/g, '_')}_Website.zip`;
        link.click();
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-gray-100 dark:bg-gray-900">
            
            {/* LEFT SIDEBAR: CONTROLS */}
            <div className="w-full md:w-[400px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-20 shadow-xl">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20">
                    <button onClick={() => navigate(-1)} className="text-xs text-gray-500 hover:text-dna-primary mb-4 flex items-center gap-1">
                        &larr; Back
                    </button>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Site Architect</h1>
                    <p className="text-sm text-gray-500 mt-1">Generate Done-For-You Landing Pages.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Brand Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Brand Profile</label>
                        <select 
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold"
                            value={selectedDnaId}
                            onChange={(e) => setSelectedDnaId(e.target.value)}
                        >
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Template Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Layout Archetype</label>
                        <div className="grid grid-cols-2 gap-3">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        selectedTemplate === t.id 
                                        ? 'border-dna-primary bg-dna-primary/5 ring-1 ring-dna-primary' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <span className="text-2xl block mb-1">{t.icon}</span>
                                    <span className="text-xs font-bold block">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button 
                        onClick={handleBuild}
                        disabled={isBuilding || !selectedDna}
                        className="w-full py-4 bg-gradient-to-r from-dna-primary to-dna-secondary text-white rounded-xl font-bold shadow-lg hover:shadow-dna-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isBuilding ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Architecting...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                Construct Site
                            </>
                        )}
                    </button>

                    {/* Export Actions */}
                    {siteData && (
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800">
                            <h4 className="text-sm font-bold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Build Complete
                            </h4>
                            <button 
                                onClick={handleExport}
                                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Source Code
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT MAIN: PREVIEW CANVAS */}
            <div className="flex-1 relative flex flex-col">
                {/* Canvas Toolbar */}
                <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview</div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button 
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-1.5 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white dark:bg-gray-600 shadow-sm text-dna-primary' : 'text-gray-400'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </button>
                        <button 
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-1.5 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white dark:bg-gray-600 shadow-sm text-dna-primary' : 'text-gray-400'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                </div>

                {/* The Iframe / Renderer */}
                <div className="flex-1 bg-gray-200 dark:bg-black/50 overflow-auto flex justify-center p-4 md:p-8">
                    {siteData && selectedDna ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-white transition-all duration-300 shadow-2xl overflow-hidden ${previewMode === 'mobile' ? 'w-[375px] rounded-3xl border-8 border-gray-800' : 'w-full max-w-6xl rounded-xl'}`}
                            style={{ minHeight: '100%' }}
                        >
                            {/* Render Sections */}
                            {(siteData.sections || []).map((section) => {
                                // Extract brand colors for styles
                                const primaryColor = selectedDna.colors[0]?.hex || '#000';
                                const secondaryColor = selectedDna.colors[1]?.hex || '#333';
                                const bgColor = selectedDna.colors.find(c => c.usage.toLowerCase().includes('background'))?.hex || '#fff';

                                if (section.type === 'hero') {
                                    return (
                                        <div key={section.id} className="relative py-20 px-8 flex flex-col md:flex-row items-center gap-10" style={{ backgroundColor: bgColor }}>
                                            <div className="flex-1">
                                                <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight" style={{ color: secondaryColor }}>{section.content.headline}</h1>
                                                <p className="text-lg md:text-xl opacity-80 mb-8" style={{ color: secondaryColor }}>{section.content.subheadline}</p>
                                                <button className="px-8 py-4 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
                                                    {section.content.ctaText}
                                                </button>
                                            </div>
                                            {section.content.imageUrl && (
                                                <div className="flex-1 w-full">
                                                    <img src={section.content.imageUrl} alt="Hero" className="rounded-2xl shadow-2xl w-full object-cover aspect-video" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                if (section.type === 'features') {
                                    return (
                                        <div key={section.id} className="py-20 px-8 bg-gray-50">
                                            <div className="max-w-6xl mx-auto">
                                                <h2 className="text-3xl font-bold text-center mb-16" style={{ color: secondaryColor }}>{section.content.headline}</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    {(section.content.items || []).map((item, idx) => (
                                                        <div key={idx} className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                                            <div className="w-12 h-12 rounded-lg mb-6 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: primaryColor }}>
                                                                {idx + 1}
                                                            </div>
                                                            <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                                                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (section.type === 'footer') {
                                    return (
                                        <div key={section.id} className="py-12 px-8 text-white text-center" style={{ backgroundColor: secondaryColor }}>
                                            <h3 className="font-bold text-2xl mb-2">{selectedDna.name}</h3>
                                            <p className="opacity-60 text-sm">&copy; {new Date().getFullYear()} All rights reserved.</p>
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full">
                            <div className="w-24 h-24 border-4 border-gray-300 dark:border-gray-700 border-dashed rounded-xl flex items-center justify-center mb-4">
                                <span className="text-4xl">🏗️</span>
                            </div>
                            <p className="font-bold uppercase tracking-widest text-sm">Waiting for blueprints...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SiteBuilderPage;
