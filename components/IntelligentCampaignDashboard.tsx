import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, CampaignAsset } from '../types';
import { CampaignPRD } from '../services/campaignPRDService';

interface IntelligentCampaignDashboardProps {
  dna: BrandDNA;
  prd: CampaignPRD;
  assets: CampaignAsset[];
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'overview' | 'refinement' | 'competitor' | 'resources' | 'voice' | 'abtest' | 'sequencing' | 'prediction';

const IntelligentCampaignDashboard: React.FC<IntelligentCampaignDashboardProps> = ({
  dna,
  prd,
  assets,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const features = [
    { id: 'refinement', icon: '✨', label: 'Refinement', desc: 'Multi-iteration improvement' },
    { id: 'competitor', icon: '🔍', label: 'Competitor', desc: 'Deep market analysis' },
    { id: 'resources', icon: '📊', label: 'Resources', desc: 'Effort & ROI planning' },
    { id: 'voice', icon: '🎯', label: 'Brand Voice', desc: 'Consistency validation' },
    { id: 'abtest', icon: '⚗️', label: 'A/B Testing', desc: 'Variant generation' },
    { id: 'sequencing', icon: '📋', label: 'Sequencing', desc: 'Dependency optimization' },
    { id: 'prediction', icon: '🚨', label: 'Risk Prediction', desc: 'Failure prevention' }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
    >
      <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🧠</span> Intelligent Campaign Engine
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Overview
          </button>
          {features.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveTab(f.id as ActiveTab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title={f.desc}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Campaign Intelligence Suite</h3>
                  <p className="text-gray-400 mb-6">
                    8 advanced AI capabilities to optimize, refine, and predict campaign success:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map(f => (
                    <div key={f.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setActiveTab(f.id as ActiveTab)}>
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <h4 className="font-bold text-white">{f.label}</h4>
                      <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6 mt-8">
                  <h4 className="font-bold text-white mb-3">Quick Start</h4>
                  <ol className="space-y-2 text-sm text-gray-300">
                    <li>1. Click a feature above to analyze your campaign</li>
                    <li>2. Review insights and recommendations</li>
                    <li>3. Apply improvements to your assets</li>
                    <li>4. Combine insights for maximum impact</li>
                  </ol>
                </div>
              </motion.div>
            )}

            {activeTab === 'refinement' && (
              <motion.div
                key="refinement"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">✨ Multi-iteration Asset Refinement</h3>
                <p className="text-gray-400 text-sm">Recursively improve assets through multiple quality cycles</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : '🚀 Refine All Assets'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300">
                  <p>✓ Scores assets across 4 dimensions (clarity, engagement, alignment, CTA strength)</p>
                  <p>✓ Identifies weakest areas and provides specific improvements</p>
                  <p>✓ Refines iteratively until target quality reached</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'competitor' && (
              <motion.div
                key="competitor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">🔍 Recursive Competitor Analysis</h3>
                <p className="text-gray-400 text-sm">Deep market research through multi-level reasoning</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : '🔎 Analyze Market'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✓ Identifies 3-4 direct competitors</p>
                  <p>✓ Analyzes positioning, strengths, weaknesses, messaging</p>
                  <p>✓ Finds market gaps and opportunity angles</p>
                  <p>✓ Generates differentiation strategy</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">📊 Smart Resource Allocation</h3>
                <p className="text-gray-400 text-sm">Estimate effort, prioritize by ROI, allocate budget</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Calculating...' : '💰 Create Budget Plan'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✓ Estimates hours per story (1-8h)</p>
                  <p>✓ Calculates complexity & risk for each</p>
                  <p>✓ Prioritizes by ROI/effort ratio</p>
                  <p>✓ Suggests iteration allocation</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">🎯 Brand Voice Consistency Validator</h3>
                <p className="text-gray-400 text-sm">Cross-validate all assets against brand guidelines</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Validating...' : '✓ Validate Brand Voice'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✓ Checks tone, messaging, style, values alignment</p>
                  <p>✓ Flags inconsistencies with severity levels</p>
                  <p>✓ Suggests specific corrections</p>
                  <p>✓ Generates consistency report</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'abtest' && (
              <motion.div
                key="abtest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">⚗️ Autonomous A/B Testing</h3>
                <p className="text-gray-400 text-sm">Generate variants, predict performance, schedule tests</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Generating...' : '🧪 Create A/B Tests'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✓ Generates 2-3 variants per asset</p>
                  <p>✓ Predicts performance (0-100)</p>
                  <p>✓ Ranks by expected lift</p>
                  <p>✓ Recommends test schedule</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'sequencing' && (
              <motion.div
                key="sequencing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">📋 Context-Aware Campaign Sequencing</h3>
                <p className="text-gray-400 text-sm">Optimize execution order based on dependencies</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Sequencing...' : '📅 Build Execution Plan'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✓ Analyzes story dependencies</p>
                  <p>✓ Finds critical path</p>
                  <p>✓ Groups stories into phases</p>
                  <p>✓ Identifies parallelizable work</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'prediction' && (
              <motion.div
                key="prediction"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white">🚨 Predictive Failure Prevention</h3>
                <p className="text-gray-400 text-sm">Analyze stories before execution, predict failures</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Predicting...' : '⚠️ Assess Risks'}
                </button>
                <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✓ Scores failure likelihood per story</p>
                  <p>✓ Identifies specific risk factors</p>
                  <p>✓ Suggests preventive measures</p>
                  <p>✓ Recommends budget adjustments</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-white/5 px-8 py-4 flex justify-between">
          <p className="text-xs text-gray-500">
            {assets.length} assets | {prd.userStories.length} stories | {dna.name}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default IntelligentCampaignDashboard;
