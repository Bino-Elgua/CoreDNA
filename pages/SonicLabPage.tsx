
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrandDNA } from '../types';
import { useNavigate } from 'react-router-dom';

const SonicLabPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BrandDNA[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BrandDNA | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState("Welcome to the Sonic Architecture Lab. This is how your brand sounds.");
  
  // Audio Viz State
  const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

  useEffect(() => {
      const stored = localStorage.getItem('core_dna_profiles');
      if (stored) {
          try {
              const parsed = JSON.parse(stored);
              setProfiles(parsed);
              if (parsed.length > 0) setSelectedProfile(parsed[0]);
          } catch(e) {}
      }
  }, []);

  // Simulate Audio Visualizer
  useEffect(() => {
      let interval: any;
      if (isPlaying) {
          interval = setInterval(() => {
              setBars(bars.map(() => Math.random() * 40 + 10));
          }, 100);
      } else {
          setBars(new Array(20).fill(5));
      }
      return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlay = () => {
      if (!selectedProfile) return;
      setIsPlaying(true);
      
      // Native Browser Speech for Demo purposes (Mocking the real API integration visualized in Settings)
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to match tone to basic params
      utterance.rate = 1.0; 
      utterance.pitch = 1.0;
      
      const tone = selectedProfile.toneOfVoice.description.toLowerCase();
      if (tone.includes('excited') || tone.includes('energetic')) {
          utterance.rate = 1.2;
          utterance.pitch = 1.2;
      } else if (tone.includes('serious') || tone.includes('calm')) {
          utterance.rate = 0.9;
          utterance.pitch = 0.8;
      }

      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
  };

  const handleSelectProfile = (id: string) => {
      const p = profiles.find(x => x.id === id) || null;
      setSelectedProfile(p);
      if (p) setText(`This is the generated voice for ${p.name}. We embody ${p.values.join(' and ')}.`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary mb-6 transition-colors font-medium group"
        >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
        </button>

        <div className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-4xl font-display font-bold mb-2">Sonic Architecture Lab</h1>
                <p className="text-gray-500">Define and test your brand's auditory identity.</p>
            </div>
            <select 
                className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold"
                onChange={(e) => handleSelectProfile(e.target.value)}
                value={selectedProfile?.id || ''}
            >
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>

        {selectedProfile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Visualizer / Player */}
                <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    
                    <div className="flex justify-between items-start">
                        <div>
                             <h3 className="text-white font-bold text-lg mb-1">{selectedProfile.name}</h3>
                             <p className="text-gray-400 text-sm">Voice Synthesis Engine: Active</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 rounded bg-white/10 text-xs text-white border border-white/10">{selectedProfile.sonicIdentity?.voiceType || 'Standard Voice'}</span>
                        </div>
                    </div>

                    {/* Bars */}
                    <div className="flex items-center justify-center gap-1 h-32">
                        {bars.map((h, i) => (
                            <motion.div 
                                key={i}
                                animate={{ height: `${h}%` }}
                                className="w-3 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full opacity-80"
                            />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none h-24"
                        />
                        <button 
                            onClick={handlePlay}
                            disabled={isPlaying}
                            className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                            {isPlaying ? (
                                <>Processing Audio Stream...</>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                    Test Voice
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                             <span>🎚️</span> Parametric Controls
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Stability</label>
                                    <span className="text-xs text-gray-500">75%</span>
                                </div>
                                <input type="range" className="w-full accent-dna-primary" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Similarity Boost</label>
                                    <span className="text-xs text-gray-500">40%</span>
                                </div>
                                <input type="range" className="w-full accent-dna-secondary" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Style Exaggeration</label>
                                    <span className="text-xs text-gray-500">0%</span>
                                </div>
                                <input type="range" className="w-full accent-dna-accent" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-3xl text-white relative overflow-hidden group cursor-pointer">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="font-bold text-xl mb-2">Generate Audio Logo</h3>
                        <p className="text-white/70 text-sm mb-6 max-w-xs">
                            Create a unique 3-second sound mark based on your brand colors and visual pattern.
                        </p>
                        <button className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-lg font-bold hover:bg-white/30 transition-colors text-sm border border-white/20">
                            Generate (Beta)
                        </button>
                    </div>
                </div>

            </div>
        ) : (
            <div className="text-center py-20 text-gray-500">Select a brand profile to enter the lab.</div>
        )}
    </div>
  );
};

export default SonicLabPage;
