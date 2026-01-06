
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CampaignAsset } from '../types';
import { generateVeoVideo } from '../services/geminiService';

interface AssetCardProps {
  asset: CampaignAsset;
  onRegenerateImage: (assetId: string, prompt: string) => void;
  onUpdateContent: (assetId: string, newContent: string) => void;
  onUpdateSchedule: (assetId: string, date: string) => void;
  onVideoReady?: (assetId: string, url: string) => void;
  onOpenEditor: (asset: CampaignAsset) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onRegenerateImage, onUpdateContent, onUpdateSchedule, onVideoReady, onOpenEditor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(asset.content);
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [isAnimating, setIsAnimating] = useState(asset.isGeneratingVideo || false);

  useEffect(() => {
    setContent(asset.content);
  }, [asset.content]);

  const handleDownload = () => {
    if (!asset.imageUrl && !asset.videoUrl) return;
    const link = document.createElement('a');
    link.href = asset.videoUrl || asset.imageUrl || '';
    link.download = `${asset.title.replace(/\s+/g, '_')}.${asset.videoUrl ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectSchedule = () => {
      if (!selectedDate) return;
      
      const stored = localStorage.getItem('core_dna_schedule');
      const currentSchedule = stored ? JSON.parse(stored) : [];
      
      const newScheduledItem = {
          ...asset,
          scheduledAt: new Date(selectedDate).toISOString(),
          brandName: 'Current Session' // In real app, pull from context
      };
      
      localStorage.setItem('core_dna_schedule', JSON.stringify([...currentSchedule, newScheduledItem]));
      onUpdateSchedule(asset.id, new Date(selectedDate).toISOString());
      setShowQuickSchedule(false);
      alert(`Asset locked in for ${new Date(selectedDate).toLocaleDateString()}!`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0a1120] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col h-full group relative"
    >
      {/* Platform Badge Overlay */}
      <div className="absolute top-6 left-6 z-10">
          <span className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-dna-secondary border border-white/10">
              {asset.channel}
          </span>
      </div>

      <div className="flex flex-col h-full">
        {/* Visual Top Area */}
        <div className="aspect-video bg-black relative overflow-hidden group/img cursor-pointer" onClick={() => onOpenEditor(asset)}>
          {asset.videoUrl ? (
              <video src={asset.videoUrl} controls className="w-full h-full object-cover" poster={asset.imageUrl} />
          ) : asset.isGeneratingImage || isAnimating ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10">
                <div className="w-12 h-12 border-4 border-dna-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-dna-primary animate-pulse">Neural Render Engine...</span>
             </div>
          ) : asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105 opacity-80 group-hover/img:opacity-100" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-gray-700 text-[10px] uppercase font-black tracking-[0.3em]">Pending Visual Assets</div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1120] to-transparent opacity-60 pointer-events-none" />
        </div>

        {/* Content Area */}
        <div className="p-8 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="font-display font-black text-xl text-white uppercase tracking-tight mb-4">{asset.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 italic">"{content}"</p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
             <div className="flex justify-between items-center">
                 <button onClick={() => onOpenEditor(asset)} className="text-[10px] font-black text-dna-primary uppercase tracking-widest hover:text-white transition-colors">Command Editor &rarr;</button>
                 <div className="flex gap-2">
                    <button onClick={() => setShowQuickSchedule(!showQuickSchedule)} className={`p-2 rounded-xl border border-white/5 transition-all ${showQuickSchedule ? 'bg-dna-secondary text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <button onClick={handleDownload} disabled={!asset.imageUrl && !asset.videoUrl} className="p-2 bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-xl disabled:opacity-20">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                 </div>
             </div>

             <AnimatePresence>
                {showQuickSchedule && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fast Track Schedule</span>
                            <button onClick={() => setShowQuickSchedule(false)} className="text-gray-500 hover:text-white">&times;</button>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-dna-secondary" 
                            />
                            <button 
                                onClick={handleDirectSchedule}
                                disabled={!selectedDate}
                                className="bg-dna-secondary text-black px-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30"
                            >
                                Lock In
                            </button>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>

             {asset.scheduledAt && (
                 <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                     Live Target: {new Date(asset.scheduledAt).toLocaleDateString()}
                 </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AssetCard;
