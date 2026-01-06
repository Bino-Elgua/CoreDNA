
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeBrandDNA, findLeadsWithMaps, runCloserAgent, generateAssetImage } from '../services/geminiService';
import { BrandDNA, LeadProfile } from '../types';
import DNAProfileCard from '../components/DNAProfileCard';
import DNAHelix from '../components/DNAHelix';
import LeadHunterPanel from '../components/LeadHunterPanel';

const ExtractPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<'dna' | 'lead'>('dna');
    const [url, setUrl] = useState('');
    const [brandName, setBrandName] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [dnaResult, setDnaResult] = useState<BrandDNA | null>(null);
    
    // Lead State
    const [niche, setNiche] = useState('');
    const [leads, setLeads] = useState<LeadProfile[]>([]);
    const [isProcessingCloser, setIsProcessingCloser] = useState<string | null>(null);

    useEffect(() => {
        if (location.state?.dna) {
            setDnaResult(location.state.dna);
        }
    }, [location.state]);

    const handleExtractDNA = async () => {
        setLoading(true);
        setLoadingMsg('Analyzing Neural Patterns...');
        try {
            const dna = await analyzeBrandDNA(url, brandName);
            setDnaResult(dna);
            const existing = localStorage.getItem('core_dna_profiles');
            const profiles = existing ? JSON.parse(existing) : [];
            profiles.unshift(dna);
            localStorage.setItem('core_dna_profiles', JSON.stringify(profiles));
        } catch (e) {
            alert("Extraction failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleFindLeads = async () => {
        if (!niche) {
            alert("Please enter a niche (e.g. 'Gyms', 'Dentists').");
            return;
        }

        setLoading(true);
        setLoadingMsg('Neural Scouring of Business Registries & Digital Footprints...');
        setLeads([]);

        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    setLoadingMsg(`Locking on coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}...`);
                    const results = await findLeadsWithMaps(niche, latitude, longitude);
                    setLeads(results);
                } catch (e) {
                    console.error("Lead Hunter Error:", e);
                    alert("Lead generation failed. The agents encountered an error.");
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                const errorMsg = error.code === 1 ? "Location access denied. Please enable location permissions." : 
                                error.code === 2 ? "Location unavailable. Please check your signal." : 
                                error.code === 3 ? "Location request timed out." : error.message;
                console.error("Geolocation error:", errorMsg);
                alert(errorMsg);
                setLoading(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const handleGeneratePortfolio = async (lead: LeadProfile) => {
        setIsProcessingCloser(lead.id);
        try {
             const sender = dnaResult || undefined;
             const portfolio = await runCloserAgent(lead, sender);
             
             // Optionally generate the visual for the sample post
             if (portfolio.posts.length > 0) {
                 const post = portfolio.posts[0];
                 const img = await generateAssetImage(post.imagePrompt || '', portfolio.targetEssence.visualDNA);
                 portfolio.posts[0].imageUrl = img;
             }

             setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, closerPortfolio: portfolio } : l));
        } catch (e) {
            console.error(e);
            alert("Failed to generate portfolio.");
        } finally {
            setIsProcessingCloser(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-20">
            <button 
                onClick={() => {
                    if (dnaResult && location.state?.dna) {
                        setDnaResult(null);
                        navigate('/dashboard');
                    } else if (dnaResult) {
                        setDnaResult(null);
                    } else {
                        navigate('/dashboard');
                    }
                }} 
                className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors font-bold"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                {dnaResult ? 'Close Portfolio' : 'Back to Dashboard'}
            </button>
            
            <div className="flex justify-center mb-10">
                <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/10 shadow-2xl">
                    <button 
                        onClick={() => setMode('dna')} 
                        className={`px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${mode === 'dna' ? 'bg-dna-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Portfolio View
                    </button>
                    <button 
                        onClick={() => setMode('lead')} 
                        className={`px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${mode === 'lead' ? 'bg-dna-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Lead Hunter
                    </button>
                </div>
            </div>

            {mode === 'dna' && (
                <div className="max-w-6xl mx-auto">
                    {!dnaResult ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#0a1120]/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/5 max-w-4xl mx-auto"
                        >
                            <h2 className="text-4xl font-display font-bold mb-8 text-center text-white">Extract DNA</h2>
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dna-primary ml-1">Company Website</label>
                                    <input 
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white text-lg outline-none focus:border-dna-primary transition-all placeholder:text-gray-600 font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dna-primary ml-1">Brand Name</label>
                                    <input 
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder="Optional: Hint for better extraction"
                                        className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white text-lg outline-none focus:border-dna-primary transition-all placeholder:text-gray-600 font-medium"
                                    />
                                </div>
                                <button 
                                    onClick={handleExtractDNA}
                                    disabled={loading || !url}
                                    className="w-full py-6 bg-gradient-to-r from-dna-primary to-dna-secondary text-white font-black uppercase tracking-widest text-xl rounded-2xl hover:scale-[1.01] transition-transform disabled:opacity-50 shadow-xl shadow-dna-primary/20"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            {loadingMsg}
                                        </div>
                                    ) : 'Extract Neural Data'}
                                </button>
                            </div>
                            {loading && <div className="mt-12 overflow-hidden rounded-3xl opacity-30"><DNAHelix /></div>}
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="max-w-5xl mx-auto">
                                <DNAProfileCard dna={dnaResult} />
                            </div>
                            
                            <div className="max-w-5xl mx-auto">
                                <DNAHelix />
                            </div>

                            {/* HUNTER PANEL INTEGRATION */}
                            <LeadHunterPanel dna={dnaResult} />

                            <div className="text-center pt-8">
                                <button onClick={() => { setDnaResult(null); navigate(location.pathname, { state: {}, replace: true }); }} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10">
                                    Analyze Different Brand
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {mode === 'lead' && (
                <div className="max-w-6xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#0a1120]/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/5 mb-10"
                    >
                        <h2 className="text-3xl font-display font-bold mb-2 text-white">Neural Lead Hunter</h2>
                        <p className="text-gray-400 text-sm mb-8 italic">Extracting real contact intel and social fingerprints from the local grid.</p>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                placeholder="Niche (e.g. MedSpas, Roofer)"
                                className="flex-1 p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white outline-none focus:border-dna-primary font-medium"
                            />
                            <button 
                                onClick={handleFindLeads}
                                disabled={loading}
                                className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-xl"
                            >
                                {loading ? 'Neural Scanning...' : 'Initialize Hunter'}
                            </button>
                        </div>
                        {loading && <p className="text-center text-[10px] font-mono text-dna-secondary mt-6 animate-pulse tracking-[0.3em] uppercase">{loadingMsg}</p>}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {leads.map((lead) => (
                            <div key={lead.id} className="bg-[#0f172a]/80 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col group transition-all hover:border-dna-primary/30">
                                {lead.gapAnalysis.socialSilence && <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] uppercase font-black px-6 py-2 rounded-bl-3xl shadow-lg z-10">Social Silence Detected</div>}
                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{lead.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold italic">
                                                <span>★ {lead.rating || 'N/A'}</span>
                                                <span className="opacity-30">•</span>
                                                <span className="truncate max-w-[200px]">{lead.address}</span>
                                            </div>
                                        </div>
                                        {lead.website && (
                                            <a href={lead.website} target="_blank" className="p-3 bg-white/5 rounded-2xl hover:bg-dna-primary/20 transition-all border border-white/5">
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        )}
                                    </div>

                                    {/* CONTACT INTEL HUB */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black text-dna-secondary uppercase tracking-widest block mb-2">Direct Outreach</span>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    <span className="text-sm font-medium text-gray-300 truncate">{lead.contactInfo?.email || 'Searching...'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    <span className="text-sm font-medium text-gray-300">{lead.contactInfo?.phone || 'Searching...'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black text-dna-primary uppercase tracking-widest block mb-2">Social Footprint</span>
                                            <div className="flex flex-wrap gap-2">
                                                {lead.contactInfo?.socials && lead.contactInfo.socials.length > 0 ? (
                                                    lead.contactInfo.socials.map((s, idx) => (
                                                        <a key={idx} href={s.url} target="_blank" className="px-3 py-1 bg-white/5 hover:bg-dna-primary/30 rounded-lg text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all border border-white/5">
                                                            {s.platform}
                                                        </a>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-red-500/50 italic">No public profiles found</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-dna-primary/5 rounded-[2rem] border border-dna-primary/10 mb-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-dna-primary animate-pulse"></span>
                                            <span className="text-[10px] font-black text-dna-primary uppercase tracking-[0.2em]">Gap Insight</span>
                                        </div>
                                        <p className="text-lg font-medium text-gray-200 leading-tight">"{lead.gapAnalysis.opportunity}"</p>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <button 
                                        onClick={() => handleGeneratePortfolio(lead)}
                                        disabled={isProcessingCloser === lead.id}
                                        className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-3xl text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                                    >
                                        {isProcessingCloser === lead.id ? 'Neural Agent Drafting Kit...' : 'Execute Full Closer Sequence'}
                                    </button>
                                </div>
                                
                                <AnimatePresence>
                                    {lead.closerPortfolio && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-8 pt-8 border-t border-white/10 space-y-8">
                                            {/* TARGET IDENTITY EXTRACTION */}
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                                                <h4 className="text-[10px] font-black text-dna-secondary uppercase tracking-[0.3em] mb-6">Target Identity Extraction</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Detected Mission</span>
                                                            <p className="text-xs text-gray-300 italic">"{lead.closerPortfolio.targetEssence.detectedMission}"</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Visual Fingerprint</span>
                                                            <p className="text-xs text-gray-300">{lead.closerPortfolio.targetEssence.visualDNA}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-end">
                                                        {lead.closerPortfolio.targetEssence.primaryColors.map((hex, i) => (
                                                            <div key={i} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg" style={{ backgroundColor: hex }} title={hex} />
                                                        ))}
                                                        <div className="ml-2">
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Brand Voice</span>
                                                            <span className="px-3 py-1 bg-dna-secondary/20 text-dna-secondary text-[10px] font-black rounded-lg uppercase tracking-widest">{lead.closerPortfolio.targetEssence.primaryTone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SAMPLE PORTFOLIO EXECUTION */}
                                            <div className="bg-black p-8 rounded-[2.5rem] space-y-8 border border-white/5">
                                                 <div className="flex justify-between items-center">
                                                     <h4 className="font-display font-black text-xl text-white uppercase tracking-wider">Strategic Portfolio</h4>
                                                     <span className="px-4 py-1.5 bg-dna-primary text-white rounded-full text-[10px] font-black uppercase shadow-lg shadow-dna-primary/30">AI Prototyped</span>
                                                 </div>
                                                 
                                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                     {/* Sample Social Post */}
                                                     <div className="space-y-4">
                                                         <span className="text-[9px] font-black text-dna-primary uppercase tracking-widest block">Proposed Content Upgrade</span>
                                                         {lead.closerPortfolio.posts[0] && (
                                                             <div className="bg-[#111] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                                                 <div className="aspect-square bg-gray-900 flex items-center justify-center relative group">
                                                                     {lead.closerPortfolio.posts[0].imageUrl ? (
                                                                         <img src={lead.closerPortfolio.posts[0].imageUrl} className="w-full h-full object-cover" alt="Sample" />
                                                                     ) : (
                                                                         <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest animate-pulse">Neural Render Pending...</div>
                                                                     )}
                                                                     <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase border border-white/10">
                                                                         {lead.closerPortfolio.posts[0].platform}
                                                                     </div>
                                                                 </div>
                                                                 <div className="p-6">
                                                                     <p className="text-xs text-gray-400 italic leading-relaxed">"{lead.closerPortfolio.posts[0].content}"</p>
                                                                 </div>
                                                             </div>
                                                         )}
                                                     </div>

                                                     {/* Outreach Materials */}
                                                     <div className="space-y-6">
                                                         <div className="p-6 bg-white/5 rounded-3xl border border-white/5 relative group cursor-pointer" onClick={() => { navigator.clipboard.writeText(lead.closerPortfolio?.emailBody || ''); alert("Email copied to clipboard!"); }}>
                                                             <span className="text-[9px] font-black text-dna-secondary uppercase mb-2 block tracking-widest">Personalized Outreach</span>
                                                             <p className="text-sm font-bold text-white mb-2 truncate italic">Sub: "{lead.closerPortfolio.subjectLine}"</p>
                                                             <p className="text-[11px] text-gray-400 line-clamp-6 leading-relaxed italic">"{lead.closerPortfolio.emailBody}"</p>
                                                             <div className="absolute inset-0 bg-dna-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                                                                 <span className="text-[10px] font-black text-white uppercase">Copy outreach script</span>
                                                             </div>
                                                         </div>

                                                         <div className="grid grid-cols-2 gap-4">
                                                             <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                                                 <span className="text-[9px] font-black text-green-500 uppercase block mb-1">Growth Forecast</span>
                                                                 <p className="text-xs font-bold text-white leading-tight">{lead.closerPortfolio.report.projectedWins}</p>
                                                             </div>
                                                             <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                                                 <span className="text-[9px] font-black text-amber-500 uppercase block mb-1">Identity Pivot</span>
                                                                 <p className="text-[10px] text-gray-400 line-clamp-2 italic">{lead.closerPortfolio.report.archetypeAnalysis.substring(0, 40)}...</p>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>

                                                 {/* SERVICE PACKAGES */}
                                                 <div className="pt-10 border-t border-white/10">
                                                     <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] text-center mb-10">Proposed Service Architecture</h4>
                                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                         {[
                                                             { data: lead.closerPortfolio.report.packages.starter, color: 'text-gray-400', bg: 'bg-white/5' },
                                                             { data: lead.closerPortfolio.report.packages.growth, color: 'text-dna-primary', bg: 'bg-dna-primary/10 border-dna-primary/20', rec: true },
                                                             { data: lead.closerPortfolio.report.packages.dominate, color: 'text-dna-secondary', bg: 'bg-dna-secondary/10 border-dna-secondary/20' }
                                                         ].map((pkg, idx) => (
                                                             <div key={idx} className={`p-6 rounded-3xl border border-white/5 flex flex-col relative ${pkg.bg}`}>
                                                                 {pkg.rec && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dna-primary text-white text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Recommended</div>}
                                                                 <span className={`text-lg font-black uppercase mb-1 ${pkg.color}`}>{pkg.data.title}</span>
                                                                 <span className="text-2xl font-display font-black text-white mb-6">{pkg.data.price}</span>
                                                                 <ul className="space-y-3 mb-8 flex-1">
                                                                     {pkg.data.features.map((f, i) => (
                                                                         <li key={i} className="text-[10px] text-gray-400 flex items-start gap-2">
                                                                             <span className={pkg.color}>•</span> {f}
                                                                         </li>
                                                                     ))}
                                                                 </ul>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                    {leads.length === 0 && !loading && (
                        <div className="text-center py-32 opacity-20">
                            <span className="text-6xl block mb-6">📡</span>
                            <p className="text-sm font-black uppercase tracking-[0.5em] text-white">Waiting for Uplink...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExtractPage;
