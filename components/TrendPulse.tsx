
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrandDNA, TrendPulseItem } from '../types';
import { generateTrendPulse } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface TrendPulseProps {
    dna: BrandDNA;
}

const TrendPulse: React.FC<TrendPulseProps> = ({ dna }) => {
    const navigate = useNavigate();
    const [trends, setTrends] = useState<TrendPulseItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTrends();
    }, [dna.id]);

    const loadTrends = async () => {
        setLoading(true);
        try {
            // Check local storage cache first to save tokens
            const key = `pulse_${dna.id}_${new Date().toDateString()}`;
            const cached = localStorage.getItem(key);
            if (cached) {
                setTrends(JSON.parse(cached));
            } else {
                const fresh = await generateTrendPulse(dna);
                setTrends(fresh);
                localStorage.setItem(key, JSON.stringify(fresh));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReact = (trend: TrendPulseItem) => {
        // Navigate to Campaigns page with preset goal
        navigate('/campaigns', { 
            state: { 
                dna, 
                prefillGoal: `Newsjacking Campaign: React to "${trend.topic}" using our angle: "${trend.suggestedAngle}"`
            } 
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 mt-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-32 h-32 text-dna-secondary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                        <span className="animate-pulse text-red-500">●</span> Living DNA Pulse
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time trend reaction engine.</p>
                </div>
                <button onClick={loadTrends} className="text-gray-400 hover:text-dna-primary p-2">
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            {loading && trends.length === 0 ? (
                <div className="space-y-4">
                    {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {trends.map((trend) => (
                        <motion.div 
                            key={trend.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-dna-secondary transition-colors group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-dna-secondary uppercase tracking-wider">{trend.relevanceScore}% Match</span>
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Trending</span>
                                </div>
                                <h3 className="font-bold text-lg leading-tight mb-2">{trend.topic}</h3>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-3">{trend.summary}</p>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-xs border border-gray-100 dark:border-gray-700 mb-4">
                                    <span className="block font-bold text-gray-400 mb-1">Our Angle:</span>
                                    {trend.suggestedAngle}
                                </div>
                            </div>
                            <button 
                                onClick={() => handleReact(trend)}
                                className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2"
                            >
                                Generate Reaction
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrendPulse;
