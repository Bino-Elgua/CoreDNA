
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, CampaignAsset, GlobalSettings } from '../types';
import { analyzeUploadedAssets, optimizeSchedule } from '../services/geminiService';
import { triggerScheduleWorkflow, getEnabledWorkflows } from '../services/workflowService';
import { useNavigate } from 'react-router-dom';

interface ScheduledAsset extends CampaignAsset {
    brandId?: string;
    brandName?: string;
    campaignGoal?: string;
}

const SchedulerPage: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // State
    const [profiles, setProfiles] = useState<BrandDNA[]>([]);
    const [selectedDnaId, setSelectedDnaId] = useState('all');
    
    // Assets State
    const [queue, setQueue] = useState<ScheduledAsset[]>([]); 
    const [scheduled, setScheduled] = useState<ScheduledAsset[]>([]); 
    const [selectedFromQueue, setSelectedFromQueue] = useState<string | null>(null);
    const [previewAsset, setPreviewAsset] = useState<ScheduledAsset | null>(null);
    
    // UI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const loadLocalData = () => {
        const storedProfiles = localStorage.getItem('core_dna_profiles');
        if (storedProfiles) {
            try {
                const parsed = JSON.parse(storedProfiles);
                if (Array.isArray(parsed)) setProfiles(parsed);
            } catch(e) {}
        }

        const storedSchedule = localStorage.getItem('core_dna_schedule');
        if (storedSchedule) {
            try { setScheduled(JSON.parse(storedSchedule)); } catch(e) {}
        }

        const storedQueue = localStorage.getItem('core_dna_pending_queue');
        if (storedQueue) {
            try { setQueue(JSON.parse(storedQueue)); } catch(e) {}
        }
    };

    useEffect(() => {
        loadLocalData();
        window.addEventListener('storage', loadLocalData);
        return () => window.removeEventListener('storage', loadLocalData);
    }, []);

    useEffect(() => {
        localStorage.setItem('core_dna_schedule', JSON.stringify(scheduled));
    }, [scheduled]);

    useEffect(() => {
        localStorage.setItem('core_dna_pending_queue', JSON.stringify(queue));
    }, [queue]);

    const filteredQueue = queue.filter(a => selectedDnaId === 'all' || a.brandId === selectedDnaId);
    const filteredScheduled = scheduled.filter(a => selectedDnaId === 'all' || a.brandId === selectedDnaId);

    const handleSyncToPlatform = async (asset: ScheduledAsset) => {
        const enabledWorkflows = getEnabledWorkflows();
        if (enabledWorkflows.length === 0) {
            console.log("No workflow provider enabled in Settings. Post locked to local grid only.");
            return;
        }

        const provider = enabledWorkflows[0];
        const brand = profiles.find(p => p.id === asset.brandId) || profiles[0];

        // Update UI to 'syncing'
        setScheduled(prev => prev.map(a => a.id === asset.id ? { ...a, syncStatus: 'syncing' } : a));

        try {
            await triggerScheduleWorkflow(provider.id, {
                dna: brand,
                goal: asset.campaignGoal || 'Ad-hoc Post',
                assets: [asset]
            });
            // Update UI to 'synced'
            setScheduled(prev => prev.map(a => a.id === asset.id ? { ...a, syncStatus: 'synced', syncError: undefined } : a));
        } catch (error: any) {
            console.error("Cloud Sync Failed:", error);
            setScheduled(prev => prev.map(a => a.id === asset.id ? { ...a, syncStatus: 'error', syncError: error.message } : a));
        }
    };

    const handleBulkDeploy = async () => {
        const toDeploy = filteredScheduled.filter(a => a.syncStatus !== 'synced');
        if (toDeploy.length === 0) {
            alert("Grid is already synced to cloud.");
            return;
        }

        setIsDeploying(true);
        for (const asset of toDeploy) {
            await handleSyncToPlatform(asset);
        }
        setIsDeploying(false);
        alert("Neural Pulse complete. Scheduled items deployed to automation layer.");
    };

    const handleDayClick = async (day: number) => {
        if (!selectedFromQueue) return;

        const assetIndex = queue.findIndex(a => a.id === selectedFromQueue);
        if (assetIndex === -1) return;

        const asset = queue[assetIndex];
        const newScheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 10, 0); 
        
        const scheduledAsset: ScheduledAsset = {
            ...asset,
            scheduledAt: newScheduledDate.toISOString(),
            syncStatus: 'pending'
        };

        // Update State
        setScheduled(prev => [...prev, scheduledAsset]);
        setQueue(prev => prev.filter(a => a.id !== selectedFromQueue));
        setSelectedFromQueue(null);

        // Auto-trigger sync if possible
        await handleSyncToPlatform(scheduledAsset);
    };

    const handleUnschedule = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const asset = scheduled.find(a => a.id === id);
        if (asset) {
            const { scheduledAt, syncStatus, ...rest } = asset;
            setQueue(prev => [rest as ScheduledAsset, ...prev]);
            setScheduled(prev => prev.filter(a => a.id !== id));
            setPreviewAsset(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDna = profiles.find(p => p.id === selectedDnaId) || profiles[0];
        if (!selectedDna) { alert("Please select a brand context for these uploads."); return; }
        
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        
        setIsAnalyzing(true);
        try {
            const files: File[] = Array.from(fileList);
            const base64s: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const reader = new FileReader();
                const promise = new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                });
                reader.readAsDataURL(files[i]);
                base64s.push(await promise);
                setUploadProgress(Math.round(((i + 1) / files.length) * 50)); 
            }

            const newAssets = await analyzeUploadedAssets(base64s, selectedDna);
            if (Array.isArray(newAssets)) {
                const tagged = newAssets.map(a => ({ ...a, brandId: selectedDna.id, brandName: selectedDna.name }));
                setQueue(prev => [...prev, ...tagged]);
            }
        } catch (err) { alert("Analysis failed."); }
        finally {
            setIsAnalyzing(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAutoSchedule = async () => {
        if (filteredQueue.length === 0) return;
        setIsAnalyzing(true);
        try {
            const optimized = await optimizeSchedule(filteredQueue);
            if (Array.isArray(optimized)) {
                const queueIds = new Set(filteredQueue.map(a => a.id));
                setQueue(prev => prev.filter(a => !queueIds.has(a.id)));
                setScheduled(prev => [...prev, ...optimized]);
            }
        } catch (e) { alert("Auto-scheduling failed."); }
        finally { setIsAnalyzing(false); }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysCount = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();
        return { daysCount, startDay };
    };

    const { daysCount, startDay } = getDaysInMonth(currentMonth);
    const dayCells = Array.from({ length: daysCount }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    const getAssetsForDay = (day: number) => {
        return filteredScheduled.filter(a => {
            if (!a.scheduledAt) return false;
            const d = new Date(a.scheduledAt);
            return d.getDate() === day && d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
        });
    };

    const getPlatformColor = (channel?: string) => {
        const c = channel?.toLowerCase() || '';
        if (c.includes('instagram')) return 'bg-pink-500';
        if (c.includes('linkedin')) return 'bg-blue-600';
        if (c.includes('email')) return 'bg-amber-500';
        if (c.includes('twitter') || c.includes('x')) return 'bg-sky-500';
        return 'bg-dna-primary';
    };

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black uppercase tracking-tight text-white">Neural Scheduler</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <select 
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-dna-secondary outline-none focus:ring-2 focus:ring-dna-secondary transition-all"
                            value={selectedDnaId}
                            onChange={(e) => setSelectedDnaId(e.target.value)}
                        >
                            <option value="all">All Brand Channels</option>
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={loadLocalData} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all" title="Neural Pulse (Sync)">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/10 transition-all flex items-center gap-2"
                        disabled={isAnalyzing}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Media Drop
                    </button>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    
                    <button 
                        onClick={handleBulkDeploy}
                        disabled={isDeploying}
                        className="px-8 py-3 bg-dna-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-dna-primary/20 flex items-center gap-3"
                    >
                        {isDeploying ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : null}
                        Deploy Live
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Content Queue Sidebar */}
                <div className="w-80 bg-[#0a1120]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-dna-secondary">Asset Queue</h3>
                            <span className="bg-dna-secondary/10 text-dna-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">{filteredQueue.length}</span>
                        </div>
                        {filteredQueue.length > 0 && (
                            <button 
                                onClick={handleAutoSchedule} 
                                className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest bg-dna-primary text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-dna-primary/10"
                            >
                                Neural Auto-Sequence
                            </button>
                        )}
                        <p className="mt-4 text-[9px] text-gray-500 leading-relaxed text-center font-bold uppercase tracking-wider">Select item below then tap a date</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {isAnalyzing && (
                            <div className="p-8 border border-dna-secondary/20 bg-dna-secondary/5 rounded-3xl text-center space-y-4">
                                <div className="w-12 h-12 border-4 border-dna-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-dna-secondary">Processing Neural Ingest... {uploadProgress}%</p>
                            </div>
                        )}
                        
                        <AnimatePresence>
                            {filteredQueue.map(asset => (
                                <motion.div 
                                    key={asset.id}
                                    layoutId={asset.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setSelectedFromQueue(selectedFromQueue === asset.id ? null : asset.id)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden ${selectedFromQueue === asset.id ? 'bg-dna-primary/20 border-dna-primary ring-2 ring-dna-primary shadow-2xl' : 'bg-white/5 border-white/5 hover:bg-white/10 shadow-lg'}`}
                                >
                                    <div className={`absolute top-0 right-0 w-1 h-full ${getPlatformColor(asset.channel)}`} />
                                    <div className="flex gap-4 mb-3">
                                        {asset.imageUrl ? (
                                            <img src={asset.imageUrl} className="w-12 h-12 object-cover rounded-xl shadow-lg border border-white/10" />
                                        ) : (
                                            <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center text-xs font-bold text-gray-600">AI</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate text-xs text-white uppercase tracking-tight">{asset.title}</h4>
                                            <span className="text-[9px] uppercase font-black tracking-widest text-dna-secondary">{asset.brandName || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed italic">"{asset.content.substring(0, 60)}..."</p>
                                    
                                    {selectedFromQueue === asset.id && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-dna-primary animate-pulse">Assign Target Slot</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {!isAnalyzing && filteredQueue.length === 0 && (
                            <div className="text-center py-24 opacity-30">
                                <span className="text-[40px] block mb-4">📭</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Queue Optimized</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar Grid View */}
                <div className="flex-1 bg-[#0a1120]/40 backdrop-blur-xl rounded-[3rem] border border-white/5 flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="p-8 flex justify-between items-center border-b border-white/5 bg-white/2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-display font-black uppercase tracking-[0.2em] text-white">
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            {selectedFromQueue && (
                                <motion.div initial={{ opacity:0, x: -10 }} animate={{ opacity:1, x: 0 }} className="px-4 py-1.5 bg-dna-primary/20 text-dna-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-dna-primary/30">
                                    Placement Mode Active
                                </motion.div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-3 bg-white/5 hover:bg-dna-primary hover:text-white text-gray-400 rounded-2xl transition-all border border-white/5">&larr;</button>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-3 bg-white/5 hover:bg-dna-primary hover:text-white text-gray-400 rounded-2xl transition-all border border-white/5">&rarr;</button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-white/5">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-black/40 p-3 text-[10px] font-black text-center uppercase tracking-[0.3em] text-gray-500">
                                {day}
                            </div>
                        ))}
                        
                        {blanks.map(i => <div key={`blank-${i}`} className="bg-black/20" />)}
                        
                        {dayCells.map(day => {
                            const dayAssets = getAssetsForDay(day);
                            const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();
                            const selectedAsset = selectedFromQueue ? queue.find(a => a.id === selectedFromQueue) : null;
                            
                            return (
                                <div 
                                    key={day} 
                                    onClick={() => handleDayClick(day)}
                                    className={`bg-black/10 p-3 relative group transition-all duration-300 cursor-pointer overflow-hidden border border-transparent ${selectedFromQueue ? 'hover:bg-dna-primary/20 hover:border-dna-primary/40' : 'hover:bg-white/5'}`}
                                >
                                    <span className={`text-[10px] font-black absolute top-3 right-4 ${isToday ? 'text-dna-secondary' : 'text-gray-600 group-hover:text-gray-400'}`}>{day}</span>
                                    
                                    <div className="mt-6 space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-hidden">
                                        {dayAssets.map(asset => (
                                            <motion.div 
                                                key={asset.id} 
                                                layoutId={`scheduled-${asset.id}`}
                                                onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                                                className={`text-[9px] ${getPlatformColor(asset.channel)}/20 text-white px-2 py-1.5 rounded-xl border border-white/10 truncate flex justify-between items-center group/item hover:scale-[1.02] transition-transform shadow-lg relative ${asset.syncStatus === 'syncing' ? 'ring-2 ring-dna-primary animate-pulse' : ''}`}
                                            >
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${getPlatformColor(asset.channel)}`} />
                                                    <span className="truncate font-black uppercase tracking-tight">{asset.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1 ml-2">
                                                    {asset.syncStatus === 'synced' && <span className="text-green-500 text-[8px]">✓</span>}
                                                    {asset.syncStatus === 'error' && <span className="text-red-500 text-[8px]">!</span>}
                                                    {asset.syncStatus === 'syncing' && <span className="w-1.5 h-1.5 bg-dna-primary rounded-full animate-ping"></span>}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    
                                    {selectedFromQueue && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-dna-primary/10 transition-opacity">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-dna-primary border border-dna-primary/50 px-4 py-2 rounded-full backdrop-blur-sm">Drop Target</span>
                                                <span className="text-[8px] font-bold text-dna-primary uppercase opacity-60">Schedule {selectedAsset?.channel}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Asset Preview Modal */}
            <AnimatePresence>
                {previewAsset && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setPreviewAsset(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a1120] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/20"
                        >
                            <div className="relative aspect-video bg-black flex items-center justify-center group/modalimg">
                                {previewAsset.imageUrl ? (
                                    <img src={previewAsset.imageUrl} className="w-full h-full object-cover opacity-80 group-hover/modalimg:opacity-100 transition-opacity" alt="Preview" />
                                ) : <div className="text-gray-600 font-black uppercase tracking-[0.3em]">Neural Identity Visual</div>}
                                <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-xl ${getPlatformColor(previewAsset.channel)}`}>
                                    {previewAsset.channel}
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-[10px] font-black text-dna-secondary uppercase tracking-[0.2em] mb-1 block">{previewAsset.brandName}</span>
                                        <h3 className="text-2xl font-display font-black text-white uppercase">{previewAsset.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-gray-500 uppercase block">Scheduled For</span>
                                        <span className="text-sm font-bold text-white">{new Date(previewAsset.scheduledAt!).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed mb-4 italic">"{previewAsset.content}"</p>
                                
                                {previewAsset.syncStatus === 'synced' ? (
                                    <div className="mb-8 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Active Cloud Automation Connected</span>
                                    </div>
                                ) : previewAsset.syncStatus === 'error' ? (
                                    <div className="mb-8 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1">Sync Error Detected</span>
                                        <p className="text-[9px] text-red-400 font-mono">{previewAsset.syncError || 'Webhook failed to acknowledge pulse.'}</p>
                                        <button onClick={() => handleSyncToPlatform(previewAsset)} className="mt-2 text-[9px] font-black text-white underline uppercase">Retry Neural Bridge</button>
                                    </div>
                                ) : (
                                    <div className="mb-8 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Grid Status: Pending Cloud Push</span>
                                        <button onClick={() => handleSyncToPlatform(previewAsset)} className="text-[10px] font-black text-dna-primary uppercase underline">Push Now</button>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={(e) => handleUnschedule(e, previewAsset.id)}
                                        className="py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all"
                                    >
                                        Drop from Grid
                                    </button>
                                    <button 
                                        onClick={() => setPreviewAsset(null)}
                                        className="py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                                    >
                                        Dismiss Intel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SchedulerPage;
