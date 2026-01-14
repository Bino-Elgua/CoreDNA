
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, CampaignAsset, SavedCampaign, UserProfile } from '../types';
import { generateCampaignAssets, generateAssetImage, runAgentHiveCampaign } from '../services/geminiService';
import { CampaignPRD } from '../services/campaignPRDService';
import AssetCard from '../components/AssetCard';
import AssetEditor from '../components/AssetEditor';
import SavedCampaignsModal from '../components/SavedCampaignsModal';
import CampaignPRDGenerator from '../components/CampaignPRDGenerator';
import AutonomousCampaignMode from '../components/AutonomousCampaignMode';
import SelfHealingPanel from '../components/SelfHealingPanel';
import IntelligentCampaignDashboard from '../components/IntelligentCampaignDashboard';

// Error boundary for this page
class CampaignErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  
  componentDidCatch(error: Error) {
    console.error('[CampaignsPage ErrorBoundary]', error);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900/20 border border-red-500 rounded-xl">
          <h3 className="text-red-400 font-bold mb-2">Page Error</h3>
          <p className="text-red-300 text-sm">{this.state.error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CampaignsPage: React.FC = () => {
  const location = useLocation();
  const baseNavigate = useNavigate();
  
  // Intercept navigate calls to see what's triggering them
  const navigate = (target: any) => {
    console.warn('[CampaignsPage] Navigation attempt:', target);
    console.trace('[CampaignsPage] Navigation trace');
    baseNavigate(target);
  };
  
  // Prevent accidental navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      console.log('[CampaignsPage] Popstate detected:', e);
      e.preventDefault();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
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
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined);
  const [debugError, setDebugError] = useState<string>('');
  const [showPRDGenerator, setShowPRDGenerator] = useState(false);
  const [selectedPRD, setSelectedPRD] = useState<CampaignPRD | null>(null);
  const [showAutonomousMode, setShowAutonomousMode] = useState(false);
  const [showIntelligentDashboard, setShowIntelligentDashboard] = useState(false);

  useEffect(() => {
    // First try location.state (from navigation)
    if (location.state?.dna) {
        setSelectedDNA(location.state.dna);
        if (location.state.prefillGoal) setGoal(location.state.prefillGoal);
        // Save to session storage so it persists on page refresh
        sessionStorage.setItem('campaign_dna', JSON.stringify(location.state.dna));
    } else {
        // Try to restore from session storage first (survives page refresh)
        const sessionDNA = sessionStorage.getItem('campaign_dna');
        if (sessionDNA) {
            try {
                setSelectedDNA(JSON.parse(sessionDNA));
            } catch (e) { console.error(e); }
        } else {
            // Fall back to first stored profile
            const stored = localStorage.getItem('core_dna_profiles');
            if (stored) {
                try {
                    const profiles = JSON.parse(stored);
                    if (profiles.length > 0) setSelectedDNA(profiles[0]);
                } catch (e) { console.error(e); }
            }
        }
    }
  }, [location.state]);

  useEffect(() => {
    const stored = localStorage.getItem('core_dna_saved_campaigns');
    if (stored) {
        try { setSavedCampaigns(JSON.parse(stored)); } catch(e) { console.error(e); }
    }
  }, []);

  // Load user profile for tier-based video features
  useEffect(() => {
    const storedUser = localStorage.getItem('core_dna_user_profile');
    if (storedUser) {
      try {
        setUserProfile(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to load user profile', e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedDNA || !goal) return;
    setLoading(true);
    setLoadingMsg('Initializing generation...');
    setHiveStatus([]);
    setAssets([]);
    console.log('[CampaignsPage] Starting campaign generation for:', selectedDNA.name);
    
    // Prevent page unload during generation
    const unloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', unloadHandler);

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
            try {
                const generatedAssets = await generateCampaignAssets(selectedDNA, goal, channels, channels.length * 2, tone === 'Brand Default' ? undefined : tone); 
                if (Array.isArray(generatedAssets)) {
                    setAssets(generatedAssets);
                    
                    // Generate images for ALL assets in parallel (faster)
                    setLoadingMsg('Generating visual assets...');
                    const imagePromises = generatedAssets.map(async (asset) => {
                        if (!asset || !asset.imagePrompt) {
                            console.warn('[CampaignsPage] Asset missing imagePrompt:', asset?.id);
                            return asset; // Return as-is if no prompt
                        }
                        
                        try {
                            console.log(`[CampaignsPage] Generating image for ${asset.id}:`, asset.imagePrompt.substring(0, 50));
                            const img = await generateAssetImage(asset.imagePrompt, selectedDNA.visualStyle?.description || 'modern style');
                            console.log(`[CampaignsPage] ✓ Image generated for ${asset.id}: ${img.substring(0, 80)}`);
                            return { ...asset, imageUrl: img, isGeneratingImage: false };
                        } catch (imgErr) {
                            console.error('[CampaignsPage] Image generation failed for asset:', asset.id, imgErr);
                            // Return asset without image - don't break the flow
                            return { ...asset, isGeneratingImage: false };
                        }
                    });
                    
                    const assetsWithImages = await Promise.all(imagePromises);
                    setAssets(assetsWithImages);
                    
                    // Log asset status
                    const withImages = assetsWithImages.filter(a => a.imageUrl).length;
                    const withoutImages = assetsWithImages.filter(a => !a.imageUrl).length;
                    console.log(`[CampaignsPage] ✓ Assets generated: ${withImages} with images, ${withoutImages} without`);
                    
                    if (withoutImages > 0) {
                        setDebugError(`⚠️ ${withoutImages} assets missing images. Check image provider in Settings.`);
                    }
                         }
                         } catch (assetErr: any) {
                         console.error('[CampaignsPage] Asset generation error:', assetErr.message);
                         setDebugError(`❌ Campaign generation failed:\n\n${assetErr.message}\n\nMake sure you have API keys configured in Settings.`);
                         throw assetErr;
                         }
                        }
                        
                        // Auto-save campaign after successful generation
                        console.log('[CampaignsPage] Auto-saving generated campaign...');
                        if (assets.length > 0) {
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
                        console.log('[CampaignsPage] Campaign auto-saved:', newSavedCampaign.id);
                        }
                        } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error ? e.stack : '';
        console.error("Campaign generation failed:", errorMsg, e);
        const fullError = `ERROR: ${errorMsg}\n\nStack: ${stack}`;
        setDebugError(fullError);
        setAssets([]); // Clear any partial data
        if (errorMsg.includes('No LLM provider')) {
            alert('❌ No API Keys Configured\n\nGo to Settings → API Keys and add at least one LLM provider (OpenAI, Claude, Gemini, etc.) with its API key.');
        } else {
            alert(`❌ Campaign generation failed:\n\n${errorMsg}\n\nCheck Settings for API keys.`);
        }
    }
    finally { 
      setLoading(false);
      window.removeEventListener('beforeunload', unloadHandler);
    }
    };

  const handleRegenerateImage = async (assetId: string, prompt: string) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isGeneratingImage: true } : a));
    try {
        const img = await generateAssetImage(prompt, selectedDNA?.visualStyle?.description || 'modern style');
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, imageUrl: img || a.imageUrl, isGeneratingImage: false } : a));
    } catch (e) { setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isGeneratingImage: false } : a)); }
  };

  const handleSaveToSchedule = () => {
      if (assets.length === 0) {
          alert("No assets to save. Generate a campaign first.");
          return;
      }
      
      try {
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

          alert("Campaign saved! You can now navigate to Scheduler to schedule posts.");
          // Don't auto-navigate - let user decide when to go
      } catch (e) {
          console.error("Save error:", e);
          alert("Failed to save campaign: " + (e instanceof Error ? e.message : String(e)));
      }
  };

  const handleSaveEditorChanges = (updatedAsset: CampaignAsset) => {
      setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
      setFocusedAsset(null);
  };

  // Log page state
  console.log('[CampaignsPage] Rendering - assets:', assets.length, 'loading:', loading, 'selectedDNA:', selectedDNA?.name);

  return (
    <CampaignErrorBoundary>
    <div className="container mx-auto px-4 py-8 pb-20">
        {debugError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <h3 className="text-red-400 font-bold mb-2">🔴 Debug Error</h3>
                <pre className="text-red-300 text-xs whitespace-pre-wrap break-words">{debugError}</pre>
                <button onClick={() => setDebugError('')} className="mt-2 text-xs bg-red-600 px-3 py-1 rounded text-white">Dismiss</button>
            </div>
        )}
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
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setShowPRDGenerator(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-300 border border-white/5 transition-all whitespace-nowrap">
                        📋 PRD
                    </button>
                    <button onClick={() => setIsSavedModalOpen(true)} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-300 border border-white/5 transition-all whitespace-nowrap">
                        📦 ({savedCampaigns.length})
                    </button>
                    {selectedPRD && (
                        <button onClick={() => setShowAutonomousMode(true)} className="px-4 py-2 bg-gradient-to-r from-dna-primary to-dna-secondary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg whitespace-nowrap">
                            🤖 Auto
                        </button>
                    )}
                    {/* Disabled for stability
                    {assets.length > 0 && (
                        <button onClick={() => setShowIntelligentDashboard(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg whitespace-nowrap">
                            🧠 Intelligence
                        </button>
                    )}
                    */}
                    {assets.length > 0 && (
                        <button onClick={handleSaveToSchedule} className="px-4 py-2 bg-dna-secondary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-dna-secondary/20 whitespace-nowrap">
                            📅 Schedule
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="p-6 bg-green-900/20 border border-green-500 rounded-xl">
                    <h3 className="text-green-400 font-bold">✅ Campaign Generated!</h3>
                    <p className="text-green-300 text-sm mt-2">Generated {assets.length} campaign assets</p>
                    <p className="text-green-200 text-xs mt-1">Mistral LLM + Stability AI Images</p>
                </div>
                
                {selectedDNA && (
                    <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-xl">
                        <p className="text-blue-300 text-sm">ℹ️ Self-Healing Panel disabled for stability. Features coming soon.</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {assets.map((asset, idx) => {
                    try {
                        return (
                            <AssetCard 
                                key={asset.id} 
                                asset={asset}
                                onRegenerateImage={handleRegenerateImage}
                                onUpdateContent={(id, content) => setAssets(prev => prev.map(a => a.id === id ? { ...a, content } : a))}
                                onUpdateSchedule={(id, date) => setAssets(prev => prev.map(a => a.id === id ? { ...a, scheduledAt: date } : a))}
                                onVideoReady={(id, url) => setAssets(prev => prev.map(a => a.id === id ? { ...a, videoUrl: url } : a))}
                                onOpenEditor={(a) => setFocusedAsset(a)}
                                user={userProfile}
                            />
                        );
                    } catch (e) {
                        console.error(`[CampaignsPage] Failed to render asset ${idx}:`, e);
                        return (
                            <div key={asset.id} className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                                <p className="text-red-300">Failed to render asset: {asset.title || `Asset ${idx}`}</p>
                            </div>
                        );
                    }
                })}
                </div>
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
        
        <AnimatePresence>
            {showPRDGenerator && selectedDNA && (
                <CampaignPRDGenerator
                    brandName={selectedDNA.name}
                    onPRDGenerated={(prd) => {
                        setSelectedPRD(prd);
                        setShowPRDGenerator(false);
                        setShowAutonomousMode(true);
                    }}
                    onClose={() => setShowPRDGenerator(false)}
                />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showAutonomousMode && selectedPRD && selectedDNA && (
                <AutonomousCampaignMode
                    dna={selectedDNA}
                    prd={selectedPRD}
                    isOpen={showAutonomousMode}
                    onClose={() => setShowAutonomousMode(false)}
                />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showIntelligentDashboard && selectedPRD && selectedDNA && (
                <IntelligentCampaignDashboard
                    dna={selectedDNA}
                    prd={selectedPRD}
                    assets={assets}
                    isOpen={showIntelligentDashboard}
                    onClose={() => setShowIntelligentDashboard(false)}
                />
            )}
        </AnimatePresence>
    </div>
    </CampaignErrorBoundary>
  );
};

export default CampaignsPage;
