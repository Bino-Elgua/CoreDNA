
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, LeadProfile } from '../types';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface LeadHunterPanelProps {
    dna: BrandDNA;
}

const LeadHunterPanel: React.FC<LeadHunterPanelProps> = ({ dna }) => {
    const { user } = useAuth();
    const isHunterTier = user?.tier === 'agency'; // Only Agency tier has Hunter access

    const [isHunting, setIsHunting] = useState(false);
    const [leads, setLeads] = useState<any[]>([]);
    const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
    
    // Auto-Close State
    const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
    const [replyInput, setReplyInput] = useState('');
    const [generatedResponse, setGeneratedResponse] = useState('');
    const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

    const handleHunt = async () => {
        if (!isHunterTier) {
            alert("Upgrade to Agency Hunter Tier to access this feature.");
            return;
        }
        setIsHunting(true);
        setLeads([]);
        try {
            // Placeholder: Would call geminiService to hunt competitors
            const mockLeads = [
                { id: '1', name: 'Competitor 1', matchScore: 72, website: 'competitor1.com', revenue: '$2.5M' },
                { id: '2', name: 'Competitor 2', matchScore: 68, website: 'competitor2.com', revenue: '$1.8M' },
                { id: '3', name: 'Competitor 3', matchScore: 65, website: 'competitor3.com', revenue: '$1.2M' },
            ];
            setLeads(mockLeads);
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            if (errorMsg.includes('No LLM provider')) {
                alert('❌ No API Keys Configured\n\nGo to Settings → API Keys and add at least one LLM provider (OpenAI, Claude, Gemini, etc.) with its API key.');
            } else {
                alert("Hunt failed. Satellites offline.");
            }
        } finally {
            setIsHunting(false);
        }
    };

    const generateEmail = (leadName: string) => {
        return `Hey ${leadName},

We just rebuilt ${dna.name}'s digital presence — unified colors, sharp tone, full portfolio. Their score jumped from 32 → 92.

Want the same? We'll do it in 48 hours.

${dna.websiteUrl || '[Our Link]'}`;
    };

    const handleAutoCloseSubmit = () => {
        if (!replyInput.trim()) return;
        setIsGeneratingResponse(true);
        
        // Simulation delay for effect
        setTimeout(() => {
            const response = `Thanks for getting back. Based on ${dna.name}'s success, here's what we'd do for you:

• Full Core DNA Portfolio — $997
• 5-Page Website — $1,997 or $299/mo
• 30 On-Brand Social Posts — Included

Let's lock your slot: https://cal.com/${user?.name?.replace(/\s/g,'').toLowerCase() || 'agency'}/strategy`;
            
            setGeneratedResponse(response);
            setIsGeneratingResponse(false);
        }, 1500);
    };

    return (
        <div className="w-full max-w-5xl mx-auto mt-12 space-y-8">
            
            {/* FEATURE 1: LEAD HUNTER */}
            <div className="bg-[#0f172a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                {!isHunterTier && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-gradient-to-r from-dna-primary to-dna-secondary p-1 rounded-2xl">
                            <div className="bg-black px-8 py-4 rounded-xl flex flex-col items-center">
                                <span className="text-2xl mb-2">🔒</span>
                                <h3 className="font-black uppercase tracking-widest text-white text-sm">Hunter Tier Only</h3>
                                <button className="mt-4 text-[10px] bg-white text-black px-4 py-2 rounded-full font-bold uppercase hover:scale-105 transition-transform">Upgrade Now</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-display font-black text-white flex items-center gap-3">
                            <span className="text-3xl">🎯</span> Target Acquisition
                        </h2>
                        <p className="text-gray-400 text-sm mt-2">Scrape and analyze competitors for {dna.name}.</p>
                    </div>
                    <button 
                        onClick={handleHunt}
                        disabled={isHunting || !isHunterTier}
                        className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-900/20 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {isHunting ? (
                            <span className="animate-pulse">Scanning Grid...</span>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                Hunt Leads for This Brand
                            </>
                        )}
                    </button>
                </div>

                {leads.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 uppercase text-[10px] font-black tracking-widest text-dna-secondary">
                                <tr>
                                    <th className="p-6">Company</th>
                                    <th className="p-6">Match</th>
                                    <th className="p-6">Revenue</th>
                                    <th className="p-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Array.isArray(leads) && leads.map((lead) => (
                                    <React.Fragment key={lead.id}>
                                        <tr className="hover:bg-white/5 transition-colors group">
                                            <td className="p-6">
                                                <div className="font-bold text-white text-base">{lead.name}</div>
                                                <div className="text-[10px] opacity-50">{lead.website}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-400 font-bold">{lead.matchScore}%</span>
                                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${lead.matchScore}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 font-mono text-xs">{lead.revenue}</td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => setActiveEmailId(activeEmailId === lead.id ? null : lead.id)}
                                                    className="px-4 py-2 bg-white/10 hover:bg-dna-primary hover:text-white text-dna-primary rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                                                >
                                                    Generate Cold Email
                                                </button>
                                            </td>
                                        </tr>
                                        {activeEmailId === lead.id && (
                                            <tr>
                                                <td colSpan={4} className="p-0">
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }} 
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        className="bg-black/40 p-6 border-y border-white/5 flex gap-4"
                                                    >
                                                        <div className="flex-1 bg-[#050b18] p-4 rounded-xl border border-white/10 font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                                                            {generateEmail(lead.name)}
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(generateEmail(lead.name));
                                                                    alert("Email copied!");
                                                                }}
                                                                className="p-4 bg-dna-secondary text-black rounded-xl font-bold hover:bg-white transition-colors"
                                                                title="Copy to Clipboard"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* FEATURE 2: AUTO-CLOSE MODE */}
            <div className="bg-[#0f172a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl p-8">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-display font-black text-white flex items-center gap-3">
                            <span className="text-3xl">🤖</span> Auto-Close Mode
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">AI Negotiation Pilot for inbound replies.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${autoCloseEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                            {autoCloseEnabled ? 'System Armed' : 'Offline'}
                        </span>
                        <button 
                            onClick={() => setAutoCloseEnabled(!autoCloseEnabled)}
                            className={`w-14 h-8 rounded-full relative transition-colors ${autoCloseEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${autoCloseEnabled ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {autoCloseEnabled && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            {/* Input Area */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Incoming Lead Reply</label>
                                <textarea 
                                    value={replyInput}
                                    onChange={(e) => setReplyInput(e.target.value)}
                                    placeholder="Paste the prospect's reply here (e.g. 'Sounds interesting, how much?')"
                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-dna-primary outline-none resize-none transition-colors"
                                />
                                <button 
                                    onClick={handleAutoCloseSubmit}
                                    disabled={!replyInput || isGeneratingResponse}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
                                >
                                    {isGeneratingResponse ? 'Analyzing Sentiment...' : 'Generate Closing Script'}
                                </button>
                            </div>

                            {/* Output Area */}
                            <div className="relative">
                                {generatedResponse ? (
                                    <div className="h-full flex flex-col">
                                        <label className="text-[10px] font-black text-dna-primary uppercase tracking-widest ml-1 mb-4">Neural Response Generated</label>
                                        <div className="flex-1 bg-gradient-to-br from-dna-primary/10 to-dna-secondary/10 border border-dna-primary/30 rounded-2xl p-6 relative">
                                            <div className="absolute -top-3 -right-3">
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(generatedResponse); alert("Copied!"); }}
                                                    className="p-2 bg-dna-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                </button>
                                            </div>
                                            <div className="font-medium text-sm text-white whitespace-pre-wrap leading-relaxed">
                                                {generatedResponse}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-gray-600 text-xs font-bold uppercase tracking-widest">
                                        Waiting for Input...
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LeadHunterPanel;
