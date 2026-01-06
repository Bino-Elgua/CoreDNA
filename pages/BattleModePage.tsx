
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { BrandDNA, BattleReport } from '../types';
import { runBattleSimulation } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

const BattleModePage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BrandDNA[]>([]);
  const [brandAId, setBrandAId] = useState<string>('');
  const [brandBId, setBrandBId] = useState<string>('');
  
  const [battleReport, setBattleReport] = useState<BattleReport | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  useEffect(() => {
      const stored = localStorage.getItem('core_dna_profiles');
      if (stored) {
          try {
              const parsed = JSON.parse(stored);
              setProfiles(parsed);
              if (parsed.length >= 2) {
                  setBrandAId(parsed[0].id);
                  setBrandBId(parsed[1].id);
              } else if (parsed.length === 1) {
                  setBrandAId(parsed[0].id);
              }
          } catch(e) {}
      }
  }, []);

  const handleFight = async () => {
      const brandA = profiles.find(p => p.id === brandAId);
      const brandB = profiles.find(p => p.id === brandBId);

      if (!brandA || !brandB) {
          alert("Please select two distinct brands to battle.");
          return;
      }
      if (brandA.id === brandB.id) {
          alert("A brand cannot battle itself. Select a different opponent.");
          return;
      }

      setIsFighting(true);
      setBattleReport(null);

      try {
          const report = await runBattleSimulation(brandA, brandB);
          setBattleReport(report);
      } catch (e) {
          console.error(e);
          alert("The battle simulation failed. The servers might be overloaded with strategy.");
      } finally {
          setIsFighting(false);
      }
  };

  const brandA = profiles.find(p => p.id === brandAId);
  const brandB = profiles.find(p => p.id === brandBId);

  return (
    <div className="container mx-auto px-4 py-8">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary mb-6 transition-colors font-medium group"
        >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
        </button>

        <h1 className="text-4xl font-display font-bold text-center mb-2">Competitive Battle Mode</h1>
        <p className="text-center text-gray-500 mb-12">Head-to-head strategic simulation and gap analysis.</p>

        {/* Selection Arena */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12">
            {/* Fighter A */}
            <div className="w-full max-w-sm bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-500 shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Challenger A</h3>
                <select 
                    value={brandAId} 
                    onChange={e => setBrandAId(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 font-bold mb-4"
                >
                    <option value="">Select Brand...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {brandA && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <p><span className="font-bold">Mission:</span> {brandA.mission.substring(0, 60)}...</p>
                        <p><span className="font-bold">Tone:</span> {brandA.toneOfVoice.adjectives.join(', ')}</p>
                    </div>
                )}
            </div>

            {/* VS Badge */}
            <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-2xl shadow-lg z-10 relative">VS</div>
                {isFighting && (
                    <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-50"></div>
                )}
            </div>

            {/* Fighter B */}
            <div className="w-full max-w-sm bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border-2 border-red-500 shadow-xl relative overflow-hidden">
                 <div className="absolute -left-6 -top-6 w-24 h-24 bg-red-500/20 rounded-full blur-xl"></div>
                 <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase mb-2">Opponent B</h3>
                 <select 
                    value={brandBId} 
                    onChange={e => setBrandBId(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 font-bold mb-4"
                >
                    <option value="">Select Brand...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {brandB && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <p><span className="font-bold">Mission:</span> {brandB.mission.substring(0, 60)}...</p>
                        <p><span className="font-bold">Tone:</span> {brandB.toneOfVoice.adjectives.join(', ')}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-16">
            <button 
                onClick={handleFight}
                disabled={isFighting || !brandAId || !brandBId}
                className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-black text-xl uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isFighting ? 'Simulating Conflict...' : 'Initialize Battle'}
            </button>
        </div>

        {/* Results Arena */}
        {battleReport && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Visualizer */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700 h-[500px]">
                        <h3 className="text-xl font-bold mb-6 text-center">Strategic Radar</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={battleReport.metrics}>
                                <PolarGrid strokeOpacity={0.2} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar
                                    name={brandA?.name || 'Brand A'}
                                    dataKey="A"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fill="#3B82F6"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name={brandB?.name || 'Brand B'}
                                    dataKey="B"
                                    stroke="#EF4444"
                                    strokeWidth={3}
                                    fill="#EF4444"
                                    fillOpacity={0.3}
                                />
                                <Legend />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none', color: 'white' }} 
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Text Analysis */}
                    <div className="space-y-6">
                        <div className={`p-8 rounded-3xl text-white shadow-lg ${battleReport.winner === 'A' ? 'bg-blue-600' : battleReport.winner === 'B' ? 'bg-red-600' : 'bg-gray-600'}`}>
                            <h3 className="text-lg font-bold uppercase opacity-80 mb-2">The Victor</h3>
                            <div className="text-4xl font-black mb-4">
                                {battleReport.winner === 'A' ? brandA?.name : battleReport.winner === 'B' ? brandB?.name : 'Stalemate'}
                            </div>
                            <p className="leading-relaxed opacity-90">{battleReport.summary}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-lg">
                            <h3 className="font-bold text-dna-primary uppercase text-sm mb-4">Blue Ocean Opportunity (Gap Analysis)</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                {battleReport.gapAnalysis}
                            </p>
                            
                            <h3 className="font-bold text-pink-500 uppercase text-sm mb-4">Visual Critique</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                "{battleReport.visualCritique}"
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
    </div>
  );
};

export default BattleModePage;
