
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, CampaignAsset, SavedCampaign } from '../types';
import { generateCampaignAssets, generateAssetImage, runAgentHiveCampaign } from '../services/geminiService';
import AssetCard from '../components/AssetCard';
import AssetEditor from '../components/AssetEditor';
import SavedCampaignsModal from '../components/SavedCampaignsModal';

const CampaignsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedDNA, setSelectedDNA] = useState<BrandDNA | null>(null);
  const [goal, setGoal] = useState('');
  const [channels, setChannels] = useState<string[]>(['Instagram', 'Email']);
  const [tone, setTone] = useState('Brand Default');
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [hiveMode, setHiveMode] = useState(false);
  const [hiveStatus, setHiveStatus] = useState<string[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [focusedAsset, setFocusedAsset] = useState<CampaignAsset | null>(null);

  useEffect(() => {
    if (location.state?.dna) {
        setSelectedDNA(location.state.dna);
        if (location.state.prefillGoal) setGoal(location.state.prefillGoal);
    } else {
        const stored = localStorage.getItem('core_dna_profiles');
        if (stored) {
            try {
                const profiles = JSON.parse(stored);
                if (profiles.length > 0) setSelectedDNA(profiles[0]);
            } catch (e) { console.error(e); }
        }
    }
  }, [location.state]);

  useEffect(() => {
    const stored = localStorage.getItem('core_dna_saved_campaigns');
    if (stored) {
        try { setSavedCampaigns(JSON.parse(stored)); } catch(e) { console.error(e); }
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedDNA || !goal) return;
    setLoading(true);
    setLoadingMsg('Initializing generation...');
    setHiveStatus([]);
    setAssets([]);

    try {
        if (hiveMode) {
            for (const channel of channels) {
                setLoadingMsg(`Hive Agent Active: ${channel}...`);
                const asset = await runAgentHiveCampaign(selectedDNA, goal, channel, (status) => {
                    setHiveStatus(prev => [...prev, `[${channel}] ${status}`]);
                });
                setAssets(prev => [...prev, asset]);
                if (asset.imagePrompt) handleRegenerateImage(asset.id, asset.imagePrompt);
            }
        } else {
            setLoadingMsg('Generating strategy & copy...');
            const generatedAssets = await generateCampaignAssets(selectedDNA, goal, channels, channels.length * 2, tone === 'Brand Default' ? undefined : tone); 
            if (Array.isArray(generatedAssets)) {
                setAssets(generatedAssets);
                for (const asset of generatedAssets) {
                    if (asset && asset.imagePrompt) {
                         await new Promise(r => setTimeout(r, 1000));
                         const img = await generateAssetImage(asset.imagePrompt, selectedDNA.visualStyle?.description || 'modern style');
                         setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, imageUrl: img, isGeneratingImage: false } : a));
                    }
                }
            }
        }
    } catch (e) { alert("Failed to generate campaign"); }
    finally { setLoading(false); }
  };

  const handleRegenerateImage = async (assetId: string, prompt: string) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isGeneratingImage: true } : a));
    try {
        const img = await generateAssetImage(prompt, selectedDNA?.visualStyle?.description || 'modern style');
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, imageUrl: img || a.imageUrl, isGeneratingImage: false } : a));
    } catch (e) { setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isGeneratingImage: false } : a)); }
  };

  const handleSaveToSchedule = () => {
      if (assets.length === 0) return;
      
      // Push to central queue in localStorage for SchedulerPage to pick up
      const storedQueue = localStorage.getItem('core_dna_pending_queue');
      const currentQueue = storedQueue ? JSON.parse(storedQueue) : [];
      
      // Mark assets with brand info for the scheduler filter
      const taggedAssets = assets.map(a => ({ 
          ...a, 
          brandId: selectedDNA?.id, 
          brandName: selectedDNA?.name,
          campaignGoal: goal
      }));
      
      const newQueue = [...currentQueue, ...taggedAssets];
      localStorage.setItem('core_dna_pending_queue', JSON.stringify(newQueue));
      
      // Also save as a permanent campaign
      const newSavedCampaign: SavedCampaign = {
          id: `camp-${Date.now()}`,
          dna: selectedDNA!,
          goal: goal,
          assets: assets,
          timestamp: Date.now()
      };
      const updatedCampaigns = [newSavedCampaign, ...savedCampaigns];
      localStorage.setItem('core_dna_saved_campaigns', JSON.stringify(updatedCampaigns));
      setSavedCampaigns(updatedCampaigns);

      alert("Campaign assets have been ported to the Neural Scheduler queue!");
      navigate('/scheduler');
  };

  const handleSaveEditorChanges = (updatedAsset: CampaignAsset) => {
      setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
      setFocusedAsset(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary mb-6 transition-colors font-medium group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
        </button>

        <div className="mb-10 bg-white dark:bg-[#0a1120]/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-black uppercase tracking-tight text-white">Campaign Suite</h1>
                    <p className="text-gray-400 text-sm">Targeting <span className="text-dna-primary font-bold">{selectedDNA?.name}</span>'s core market segments.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsSavedModalOpen(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-gray-300 border border-white/5 transition-all">
                        Archive ({savedCampaigns.length})
                    </button>
                    {assets.length > 0 && (
                        <button onClick={handleSaveToSchedule} className="px-6 py-2 bg-dna-secondary text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-dna-secondary/20">
                            Port to Schedule
                        </button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1">Market Directive / Campaign Goal</label>
                    <textarea 
                        className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white text-lg outline-none focus:border-dna-primary transition-all placeholder:text-gray-600 font-medium h-40 resize-none" 
                        placeholder="e.g. 'Launch a sustainable summer collection for Gen-Z urban dwellers...'" 
                        value={goal} 
                        onChange={e => setGoal(e.target.value)} 
                    />
                </div>
                <div className="flex flex-col gap-6 p-6 bg-black/40 rounded-3xl border border-white/5">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hive Logic</label>
                            <button onClick={() => setHiveMode(!hiveMode)} className={`w-12 h-6 rounded-full relative transition-colors ${hiveMode ? 'bg-dna-primary' : 'bg-gray-700'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${hiveMode ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Hive mode utilizes multi-agent simulation for higher accuracy.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Distribution Channels</label>
                        <div className="flex flex-wrap gap-2">
                            {['Instagram', 'LinkedIn', 'Email', 'Twitter/X'].map(c => (
                                <button key={c} onClick={() => setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${channels.includes(c) ? 'bg-dna-secondary text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{c}</button>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={handleGenerate} disabled={loading || !goal} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl">
                        {loading ? <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : 'Execute Sequence'}
                    </button>
                </div>
            </div>
        </div>

        <AnimatePresence>
            {hiveMode && hiveStatus.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-10 p-6 bg-black/60 rounded-3xl border border-dna-primary/20 overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase text-dna-primary mb-4 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-dna-primary animate-pulse"></span>
                        Neural Agent Log
                    </h3>
                    <div className="space-y-2 font-mono text-[11px]">
                        {hiveStatus.map((s, i) => (
                            <div key={i} className="text-gray-400">
                                <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {s}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {assets.length > 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {assets.map(asset => (
                    <AssetCard 
                        key={asset.id} 
                        asset={asset}
                        onRegenerateImage={handleRegenerateImage}
                        onUpdateContent={(id, content) => setAssets(prev => prev.map(a => a.id === id ? { ...a, content } : a))}
                        onUpdateSchedule={(id, date) => setAssets(prev => prev.map(a => a.id === id ? { ...a, scheduledAt: date } : a))}
                        onVideoReady={(id, url) => setAssets(prev => prev.map(a => a.id === id ? { ...a, videoUrl: url } : a))}
                        onOpenEditor={(a) => setFocusedAsset(a)}
                    />
                ))}
            </motion.div>
        )}

        {focusedAsset && selectedDNA && (
            <AssetEditor 
                isOpen={!!focusedAsset}
                asset={focusedAsset}
                dna={selectedDNA}
                onClose={() => setFocusedAsset(null)}
                onSave={handleSaveEditorChanges}
            />
        )}
        
        <SavedCampaignsModal isOpen={isSavedModalOpen} onClose={() => setIsSavedModalOpen(false)} savedCampaigns={savedCampaigns} onLoad={(c) => { setAssets(c.assets); setGoal(c.goal); setIsSavedModalOpen(false); }} onDelete={(id) => setSavedCampaigns(prev => prev.filter(c => c.id !== id))} />
    </div>
  );
};

export default CampaignsPage;
