
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CampaignAsset, BrandDNA } from '../types';
import { refineAssetWithAI, generateAssetImage } from '../services/geminiService';

interface AssetEditorProps {
    isOpen: boolean;
    onClose: () => void;
    asset: CampaignAsset;
    dna: BrandDNA;
    onSave: (updatedAsset: CampaignAsset) => void;
}

const AssetEditor: React.FC<AssetEditorProps> = ({ isOpen, onClose, asset, dna, onSave }) => {
    const [title, setTitle] = useState(asset.title);
    const [content, setContent] = useState(asset.content);
    const [imagePrompt, setImagePrompt] = useState(asset.imagePrompt);
    const [aiInstruction, setAiInstruction] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleAIRefine = async () => {
        if (!aiInstruction) return;
        setIsRefining(true);
        try {
            const transformed = await refineAssetWithAI(dna, { ...asset, title, content, imagePrompt }, aiInstruction);
            setTitle(transformed.title);
            setContent(transformed.content);
            setImagePrompt(transformed.imagePrompt);
            setAiInstruction('');
        } catch (e) {
            alert("AI Transformation failed. Check connectivity.");
        } finally {
            setIsRefining(false);
        }
    };

    const handleRegenerateVisual = async () => {
        setIsGenerating(true);
        try {
            const newUrl = await generateAssetImage(imagePrompt, dna.visualStyle?.description || 'Modern');
            if (newUrl) {
                onSave({ ...asset, title, content, imagePrompt, imageUrl: newUrl });
            }
        } catch (e) {
            alert("Visual generation error.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleManualSave = () => {
        onSave({ ...asset, title, content, imagePrompt });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-8">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full max-w-6xl bg-white dark:bg-gray-800 rounded-none md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Visual Preview */}
                <div className="w-full md:w-1/2 bg-black relative group">
                    {asset.videoUrl ? (
                        <video src={asset.videoUrl} controls className="w-full h-full object-contain" />
                    ) : asset.imageUrl ? (
                        <img src={asset.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest">No Visual Ready</div>
                    )}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="text-white font-bold animate-pulse">Forging Visual Reality...</span>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-lg text-[10px] text-white font-mono border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        ID: {asset.id}
                    </div>
                </div>

                {/* Editor Controls */}
                <div className="w-full md:w-1/2 flex flex-col h-full bg-white dark:bg-gray-900">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                        <h2 className="text-xl font-bold font-display flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full bg-dna-primary animate-pulse"></span>
                             Command Center
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* AI Command Tool */}
                        <div className="bg-gradient-to-br from-dna-primary/10 to-dna-secondary/10 p-4 rounded-2xl border border-dna-primary/20">
                            <label className="block text-[10px] font-bold uppercase text-dna-primary mb-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                AI Refine Command
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    value={aiInstruction}
                                    onChange={(e) => setAiInstruction(e.target.value)}
                                    placeholder="e.g. 'Make it more playful' or 'Pivot to a summer vibe'"
                                    className="flex-1 bg-white dark:bg-gray-800 p-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-dna-primary"
                                />
                                <button 
                                    onClick={handleAIRefine}
                                    disabled={!aiInstruction || isRefining}
                                    className="bg-dna-primary text-white px-4 rounded-xl text-xs font-bold hover:bg-dna-secondary transition-all disabled:opacity-50"
                                >
                                    {isRefining ? '...' : 'Execute'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Headline</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-bold border border-gray-100 dark:border-gray-700" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Copy Content</label>
                                <textarea 
                                    value={content} 
                                    onChange={(e) => setContent(e.target.value)} 
                                    className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-100 dark:border-gray-700 resize-none custom-scrollbar" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Visual Prompt</label>
                                <div className="flex gap-2">
                                    <textarea 
                                        value={imagePrompt} 
                                        onChange={(e) => setImagePrompt(e.target.value)} 
                                        className="flex-1 h-20 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-[11px] font-mono border border-gray-100 dark:border-gray-700 resize-none" 
                                    />
                                    <button 
                                        onClick={handleRegenerateVisual}
                                        disabled={isGenerating}
                                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 rounded-lg text-[10px] font-bold hover:opacity-80 transition-opacity"
                                    >
                                        Re-Gen Visual
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3 bg-gray-50 dark:bg-black/20">
                        <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">Discard</button>
                        <button onClick={handleManualSave} className="flex-1 py-3 bg-dna-primary text-white rounded-xl font-bold shadow-lg hover:shadow-dna-primary/30 transition-all">Apply Changes</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AssetEditor;
