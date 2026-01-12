import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCampaignPRD, saveCampaignPRD, CampaignPRD } from '../services/campaignPRDService';

interface CampaignPRDGeneratorProps {
  brandName: string;
  onPRDGenerated: (prd: CampaignPRD) => void;
  onClose: () => void;
}

const CampaignPRDGenerator: React.FC<CampaignPRDGeneratorProps> = ({
  brandName,
  onPRDGenerated,
  onClose
}) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Generating, 3: Review
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [prd, setPrd] = useState<CampaignPRD | null>(null);

  const [formData, setFormData] = useState({
    campaignGoal: '',
    targetAudience: '',
    channels: ['Instagram', 'Email'],
    timeline: '30 days',
    budget: '',
    brandContext: ''
  });

  const channels = ['Instagram', 'LinkedIn', 'Email', 'Twitter/X', 'TikTok', 'YouTube', 'Blog'];

  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleGenerate = async () => {
    if (!formData.campaignGoal.trim()) {
      alert('Please enter a campaign goal');
      return;
    }

    setLoading(true);
    setStep(2);
    setProgress('Starting generation...');

    try {
      const generatedPRD = await generateCampaignPRD(
        {
          brandName,
          campaignGoal: formData.campaignGoal,
          targetAudience: formData.targetAudience,
          channels: formData.channels,
          timeline: formData.timeline,
          budget: formData.budget,
          brandContext: formData.brandContext
        },
        (msg) => setProgress(msg)
      );

      setPrd(generatedPRD);
      saveCampaignPRD(generatedPRD);
      setStep(3);
    } catch (error: any) {
      alert(`Error generating PRD: ${error.message}`);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pointer-events-auto"
    >
      <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-dna-primary to-dna-secondary p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span>📋</span> Campaign PRD Generator
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                    Brand
                  </label>
                  <input
                    type="text"
                    disabled
                    value={brandName}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                    Campaign Goal *
                  </label>
                  <textarea
                    value={formData.campaignGoal}
                    onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
                    placeholder="e.g., 'Launch a sustainable summer collection targeting Gen-Z urban consumers with 40% conversion increase'"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-dna-primary outline-none h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="e.g., 'Gen-Z eco-conscious women, 18-28, urban'"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-dna-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                    Distribution Channels
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {channels.map(c => (
                      <button
                        key={c}
                        onClick={() => handleChannelToggle(c)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          formData.channels.includes(c)
                            ? 'bg-dna-primary text-black'
                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                      Timeline
                    </label>
                    <input
                      type="text"
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      placeholder="e.g., '30 days', '90 days'"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-dna-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                      Budget (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="e.g., '$10K', 'Organic only'"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-dna-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-dna-primary ml-1 mb-2 block">
                    Additional Brand Context
                  </label>
                  <textarea
                    value={formData.brandContext}
                    onChange={(e) => setFormData({ ...formData, brandContext: e.target.value })}
                    placeholder="Any special instructions or brand guidelines"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-dna-primary outline-none h-16 resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Generate PRD
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <div className="animate-spin">
                  <svg className="w-12 h-12 text-dna-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} opacity={0.25} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold mb-2">{progress || 'Generating PRD...'}</p>
                  <p className="text-gray-400 text-sm">This may take a moment...</p>
                </div>
              </motion.div>
            )}

            {step === 3 && prd && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{prd.projectName}</h3>
                  <p className="text-gray-400 text-sm mb-4">{prd.description}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto">
                  {prd.userStories.map((story, idx) => (
                    <div key={story.id} className="border-l-2 border-dna-primary pl-3 py-1">
                      <p className="text-sm font-bold text-white">{story.title}</p>
                      <p className="text-xs text-gray-400">{story.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] bg-dna-primary/20 text-dna-secondary px-2 py-1 rounded">
                          {story.type}
                        </span>
                        {story.estimatedHours && (
                          <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded">
                            ~{story.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      onPRDGenerated(prd);
                      onClose();
                    }}
                    className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors"
                  >
                    Use This PRD
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CampaignPRDGenerator;
