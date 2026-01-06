
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BrandDNA } from '../types';
import { exportBrandProfileToPDF } from '../services/pdfService';
import { analyzeAccessibility } from '../services/accessibilityService';
import { useNavigate } from 'react-router-dom';

interface DNAProfileCardProps {
  dna: BrandDNA;
  onShare?: () => void;
  readOnly?: boolean;
}

const DNAProfileCard: React.FC<DNAProfileCardProps> = ({ dna, onShare, readOnly = false }) => {
  const navigate = useNavigate();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const chartData = useMemo(() => {
    const scores = dna.confidenceScores || { visuals: 80, strategy: 80, tone: 80, overall: 80 };
    return [
        { subject: 'Visuals', A: scores.visuals, fullMark: 100 },
        { subject: 'Strategy', A: scores.strategy, fullMark: 100 },
        { subject: 'Tone', A: scores.tone, fullMark: 100 },
        { subject: 'Trend', A: dna.trendAlignment?.score || 85, fullMark: 100 },
        { subject: 'Sonic', A: 75, fullMark: 100 },
    ];
  }, [dna]);

  const cards = [
      { id: 'pro', title: 'Intelligence', color: 'text-orange-500' },
      { id: 'metrics', title: 'Performance', color: 'text-pink-500' },
      { id: 'strategy', title: 'Strategy', color: 'text-dna-primary' },
      { id: 'visuals', title: 'Visual DNA', color: 'text-dna-secondary' },
      { id: 'market', title: 'Market Gaps', color: 'text-purple-500' },
      { id: 'voice', title: 'Brand Archetype', color: 'text-gray-500' },
  ];

  const nextCard = () => { setDirection(1); setActiveCardIndex((prev) => (prev + 1) % cards.length); };
  const prevCard = () => { setDirection(-1); setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length); };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 100 : -100, opacity: 0 })
  };

  return (
    <div id="dna-profile-container" className="w-full max-w-5xl mx-auto bg-[#0a1120]/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col">
      {/* Hero Header */}
      <div className="relative h-48 md:h-64 w-full bg-gray-900 group shrink-0">
        {dna.heroImageUrl ? <img src={dna.heroImageUrl} className="w-full h-full object-cover opacity-60" alt="Hero" /> : <div className="w-full h-full bg-gradient-to-r from-dna-primary to-dna-secondary opacity-30" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1120] via-transparent to-transparent flex items-end p-8 md:p-12">
            <div className="text-white">
                <h1 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight mb-2">{dna.name}</h1>
                <p className="text-lg md:text-xl text-dna-secondary font-medium tracking-wide line-clamp-1 italic">"{dna.tagline}"</p>
            </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/5 p-4 border-b border-white/5 overflow-x-auto custom-scrollbar-hidden shrink-0">
          <div className="flex justify-center gap-2 min-w-max">
              {cards.map((c, i) => (
                  <button key={c.id} onClick={() => { setDirection(i > activeCardIndex ? 1 : -1); setActiveCardIndex(i); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeCardIndex === i ? 'bg-dna-primary text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{c.title}</button>
              ))}
          </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-grow min-h-[600px] overflow-hidden">
          <button onClick={prevCard} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/5 hover:bg-dna-primary text-white rounded-full transition-all border border-white/5">&larr;</button>
          <button onClick={nextCard} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/5 hover:bg-dna-primary text-white rounded-full transition-all border border-white/5">&rarr;</button>

          <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div key={activeCardIndex} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                className="p-8 md:p-14 h-full flex flex-col"
              >
                  <h3 className={`text-2xl font-display font-black uppercase tracking-widest mb-10 flex items-center gap-4 ${cards[activeCardIndex].color}`}><span className="text-4xl opacity-20">0{activeCardIndex + 1}</span> {cards[activeCardIndex].title}</h3>

                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-12">
                      
                      {/* INTELLIGENCE TAB */}
                      {cards[activeCardIndex].id === 'pro' && (
                          <div className="space-y-12">
                              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-dna-primary mb-6">Strategic Positioning Report</h4>
                                  <div className="text-lg text-gray-200 leading-relaxed space-y-6">
                                      {(dna.description || '').split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="p-8 bg-black/40 rounded-3xl border border-white/5">
                                      <span className="text-[10px] font-black text-gray-500 uppercase block mb-4">Mission Intelligence</span>
                                      <p className="text-sm text-gray-300 leading-relaxed">{dna.mission}</p>
                                  </div>
                                  <div className="p-8 bg-black/40 rounded-3xl border border-white/5">
                                      <span className="text-[10px] font-black text-gray-500 uppercase block mb-4">Macro Trend Analysis</span>
                                      <h5 className="text-white font-bold mb-2">{dna.trendAlignment?.trendName}</h5>
                                      <p className="text-sm text-gray-400 leading-relaxed italic">"{dna.trendAlignment?.reasoning}"</p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* PERFORMANCE TAB */}
                      {cards[activeCardIndex].id === 'metrics' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                               <div className="h-[350px] bg-black/20 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                            <PolarGrid strokeOpacity={0.1} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                                            <Radar name="Brand" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                            <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: 'white' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                               </div>
                               <div className="flex flex-col justify-center space-y-8">
                                    {Object.entries(dna.confidenceScores).map(([k, v]) => (
                                        <div key={k}>
                                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                                                <span>{k} Vector Precision</span>
                                                <span className="text-white">{v}%</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-dna-primary to-dna-secondary" />
                                            </div>
                                        </div>
                                    ))}
                               </div>
                          </div>
                      )}

                      {/* STRATEGY TAB */}
                      {cards[activeCardIndex].id === 'strategy' && (
                          <div className="space-y-12">
                              <div className="p-10 bg-gradient-to-br from-dna-primary/10 to-transparent rounded-[3rem] border border-dna-primary/20">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-dna-primary mb-6">Elevator Engine</h4>
                                  <p className="text-2xl text-white font-medium leading-relaxed italic">"{dna.elevatorPitch}"</p>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                  <div className="space-y-6">
                                      <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Brand Implementation Values</h4>
                                      {(dna.values || []).map((v, i) => (
                                          <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-dna-primary/30 transition-colors">
                                              <p className="text-sm text-gray-200 leading-relaxed font-bold">{v}</p>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="space-y-6">
                                      <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Messaging Pillars</h4>
                                      {(dna.keyMessaging || []).map((m, idx) => (
                                          <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-dna-secondary/30 transition-colors">
                                              <p className="text-sm text-gray-300 leading-relaxed">• {m}</p>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* VISUAL DNA TAB */}
                      {cards[activeCardIndex].id === 'visuals' && (
                          <div className="space-y-16 pb-12">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                  <div>
                                      <h4 className="text-[10px] font-black text-dna-primary uppercase mb-6 tracking-widest">Primary Identity Palette</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {(dna.colors || []).map((c, i) => (
                                              <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-xl">
                                                  <div className="w-14 h-14 rounded-2xl shadow-lg border-2 border-white/10 shrink-0" style={{ backgroundColor: c.hex }} />
                                                  <div className="min-w-0">
                                                      <p className="text-xs font-black uppercase text-white truncate">{c.name}</p>
                                                      <p className="text-[10px] text-gray-500 font-mono mb-1">{c.hex}</p>
                                                      <p className="text-[9px] text-gray-400 italic line-clamp-2">{c.psychology}</p>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <h4 className="text-[10px] font-black text-dna-secondary uppercase mb-6 tracking-widest">Typography System</h4>
                                      <div className="space-y-8">
                                          {(dna.fonts || []).map((f, i) => (
                                              <div key={i} className="border-l-4 border-dna-secondary pl-6">
                                                  <span className="text-[9px] font-black text-dna-secondary uppercase bg-dna-secondary/10 px-2 py-1 rounded-md">{f.pairingRole || 'Font'}</span>
                                                  <p className="text-2xl text-white font-medium mt-2" style={{ fontFamily: f.family }}>{f.family}</p>
                                                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{f.description}</p>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                                  <h4 className="text-[10px] font-black text-pink-500 uppercase mb-8 tracking-[0.4em]">Design System Directives</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                      <div className="space-y-6">
                                          <h5 className="text-xs font-bold text-gray-400 uppercase">Mandatory Execution Rules</h5>
                                          <ul className="space-y-4">
                                              {(dna.visualIdentityExtended?.designRules || []).map((rule, i) => (
                                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                                                      <span className="text-pink-500 mt-1">◈</span> {rule}
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                      <div className="space-y-8">
                                          <div>
                                              <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Grid & Layout Strategy</h5>
                                              <p className="text-sm text-gray-300 leading-relaxed italic">"{dna.visualIdentityExtended?.layoutStyle}"</p>
                                          </div>
                                          <div>
                                              <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Imagery Context</h5>
                                              <p className="text-sm text-gray-300 leading-relaxed italic">"{dna.visualIdentityExtended?.imageryGuidelines}"</p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* MARKET GAPS TAB */}
                      {cards[activeCardIndex].id === 'market' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12">
                               <div className="space-y-6">
                                   <div className="p-8 bg-green-500/5 rounded-[2.5rem] border border-green-500/10 h-full">
                                       <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mb-8">Blue Ocean Opportunities</h4>
                                       <ul className="space-y-8">
                                           {(dna.swot?.opportunities || []).map((o, idx) => (
                                               <li key={idx} className="text-sm text-gray-200 flex items-start gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                                                   <span className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 font-bold">✔</span> 
                                                   <span>{o}</span>
                                               </li>
                                           ))}
                                       </ul>
                                   </div>
                               </div>
                               <div className="space-y-6">
                                   <div className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10 h-full">
                                       <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-8">Competitive Risks</h4>
                                       <ul className="space-y-8">
                                           {(dna.swot?.threats || []).map((t, idx) => (
                                               <li key={idx} className="text-sm text-gray-200 flex items-start gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                                                   <span className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 font-bold">✕</span> 
                                                   <span>{t}</span>
                                               </li>
                                           ))}
                                       </ul>
                                   </div>
                               </div>
                          </div>
                      )}

                      {/* VOICE & ARCHETYPE TAB */}
                      {cards[activeCardIndex].id === 'voice' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-12">
                               <div className="space-y-10">
                                   <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                                       <h4 className="text-[10px] font-black text-dna-primary uppercase mb-6 tracking-widest">Brand Archetype Intelligence</h4>
                                       <div className="flex flex-wrap gap-3 mb-8">
                                           {(dna.brandPersonality || []).map(p => (
                                               <span key={p} className="px-5 py-2 bg-dna-primary text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-dna-primary/20">{p}</span>
                                           ))}
                                       </div>
                                       <p className="text-lg text-gray-200 leading-relaxed italic">"{dna.toneOfVoice?.description}"</p>
                                   </div>
                                   <div className="p-8 bg-black/40 rounded-3xl border border-white/5">
                                        <h5 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">Voice Guidelines</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {dna.toneOfVoice.adjectives.map(a => <span key={a} className="px-3 py-1 bg-white/10 rounded-lg text-xs text-gray-300"># {a}</span>)}
                                        </div>
                                   </div>
                               </div>
                               <div className="space-y-8">
                                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Target Persona Deep-Dive</h4>
                                   {(dna.personas || []).map((persona, idx) => (
                                       <div key={idx} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                           <div className="absolute top-0 right-0 w-32 h-32 bg-dna-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
                                           <h5 className="text-xl font-bold text-white mb-2">{persona.name}</h5>
                                           <p className="text-[10px] text-dna-secondary uppercase font-black tracking-widest mb-6">{persona.demographics}</p>
                                           <div className="text-sm text-gray-400 leading-relaxed mb-8 italic">"{persona.psychographics}"</div>
                                           <div className="grid grid-cols-2 gap-4">
                                               <div className="space-y-2">
                                                   <span className="text-[9px] font-black text-red-400 uppercase">Core Pain Points</span>
                                                   {persona.painPoints.map((pp, i) => <p key={i} className="text-[11px] text-gray-500">• {pp}</p>)}
                                               </div>
                                               <div className="space-y-2">
                                                   <span className="text-[9px] font-black text-green-400 uppercase">Key Behaviors</span>
                                                   {persona.behaviors.map((b, i) => <p key={i} className="text-[11px] text-gray-500">• {b}</p>)}
                                               </div>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                          </div>
                      )}
                  </div>
              </motion.div>
          </AnimatePresence>
      </div>
      
      {/* Action Footer */}
      {!readOnly && (
          <div className="p-10 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
               <button onClick={() => navigate('/campaigns', { state: { dna } })} className="w-full sm:w-auto px-10 py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-white/5">Launch Campaigns</button>
               <div className="flex gap-4 w-full sm:w-auto">
                  <button onClick={() => exportBrandProfileToPDF('dna-profile-container', dna)} className="flex-1 sm:flex-none px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white font-bold text-xs uppercase border border-white/10 tracking-widest" title="Export High-Res PDF">Export PDF</button>
                  <button onClick={onShare} className="flex-1 sm:flex-none px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white font-bold text-xs uppercase border border-white/10 tracking-widest" title="Generate Shareable Link">Share Twin</button>
               </div>
          </div>
      )}
    </div>
  );
};

export default DNAProfileCard;
