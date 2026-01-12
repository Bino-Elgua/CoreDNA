import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA } from '../types';
import { CampaignPRD, getPRDProgress } from '../services/campaignPRDService';
import {
  runAutonomousCampaign,
  executeNextStory,
  getExecutionState,
  saveLearningsToAGENTS,
  AutoExecutionProgress
} from '../services/autonomousCampaignService';

interface AutonomousCampaignModeProps {
  dna: BrandDNA;
  prd: CampaignPRD;
  isOpen: boolean;
  onClose: () => void;
}

const AutonomousCampaignMode: React.FC<AutonomousCampaignModeProps> = ({
  dna,
  prd,
  isOpen,
  onClose
}) => {
  const [mode, setMode] = useState<'initial' | 'running' | 'complete'>('initial');
  const [progress, setProgress] = useState<AutoExecutionProgress | null>(null);
  const [iterations, setIterations] = useState(10);
  const [autoRun, setAutoRun] = useState(false);

  const handleStartAutonomous = async () => {
    setMode('running');
    setProgress({
      prdId: prd.id,
      currentStoryId: '',
      storyIndex: 0,
      totalStories: prd.userStories.length,
      iterationCount: 0,
      status: 'pending',
      message: 'Starting autonomous campaign execution...',
      assets: [],
      learnings: []
    });

    try {
      console.log('[AutonomousCampaignMode] Starting autonomous campaign for PRD:', prd.id);
      await runAutonomousCampaign(prd, dna, iterations, (p) => {
        console.log('[AutonomousCampaignMode] Progress update:', p.message);
        setProgress(p);
      });

      console.log('[AutonomousCampaignMode] Campaign complete, saving learnings');
      saveLearningsToAGENTS(prd.id);
      setMode('complete');
      // Don't close modal - user needs to see completion screen
    } catch (error: any) {
      console.error('[AutonomousCampaignMode] Autonomous execution failed:', error.message, error.stack);
      setProgress(prev => prev ? {
        ...prev,
        status: 'failed',
        message: `Error: ${error.message}. Make sure you have LLM API keys configured in Settings.`
      } : null);
      setMode('initial');
    }
  };

  const handleStepByStep = async () => {
    setMode('running');

    const result = await executeNextStory(prd, dna, (p) => {
      setProgress(p);
    });

    if (result.success) {
      const currentProgress = getPRDProgress(prd);
      if (currentProgress.completed === currentProgress.total) {
        setMode('complete');
        saveLearningsToAGENTS(prd.id);
      }
    }
  };

  const prdProgress = getPRDProgress(prd);
  const state = getExecutionState();

  if (!isOpen) return null;

  const hasError = progress?.status === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
    >
      <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-dna-primary to-dna-secondary p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🤖</span> Autonomous Campaign Mode
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'initial' && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{prd.projectName}</h3>
                  <p className="text-gray-400">{prd.description}</p>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-white">Campaign Progress</span>
                    <span className="text-sm text-dna-primary font-bold">
                      {prdProgress.completed}/{prdProgress.total} complete
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prdProgress.percent}%` }}
                      className="h-full bg-gradient-to-r from-dna-primary to-dna-secondary"
                    />
                  </div>
                </div>

                {/* Stories Overview */}
                <div className="bg-white/5 rounded-xl p-4 max-h-48 overflow-y-auto">
                  <h4 className="font-bold text-white mb-3">Stories to Execute</h4>
                  <div className="space-y-2">
                    {prd.userStories.map((story) => (
                      <div key={story.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-4 h-4 rounded-full ${story.passes ? 'bg-green-500' : 'bg-gray-600'}`} />
                        <span className="text-gray-300">{story.title}</span>
                        <span className="text-xs text-gray-500 ml-auto">{story.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={autoRun}
                        onChange={(e) => setAutoRun(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-white">🚀 Full Autonomous Mode</p>
                        <p className="text-xs text-gray-400">AI executes all stories automatically until complete</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={!autoRun}
                        onChange={(e) => setAutoRun(!e.target.checked)}
                        className="cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-white">👣 Step-by-Step Mode</p>
                        <p className="text-xs text-gray-400">Execute one story at a time with human approval</p>
                      </div>
                    </label>
                  </div>
                </div>

                {autoRun && (
                  <div className="bg-white/5 border border-dna-primary/30 rounded-xl p-4">
                    <label className="text-sm font-bold text-white block mb-2">Max Iterations</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={iterations}
                      onChange={(e) => setIterations(parseInt(e.target.value))}
                      className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Maximum attempts per story before moving to next
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={autoRun ? handleStartAutonomous : handleStepByStep}
                    className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100"
                  >
                    {autoRun ? 'Start Autonomous' : 'Execute Next Story'}
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'running' && progress && (
               <motion.div
                 key="running"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="space-y-6"
               >
                 {hasError ? (
                   <div className="text-center space-y-4">
                     <div className="text-5xl">⚠️</div>
                     <div>
                       <h3 className="text-xl font-bold text-red-400 mb-2">Execution Failed</h3>
                       <p className="text-gray-400 text-sm mb-4">{progress.message}</p>
                     </div>
                     <button
                       onClick={() => setMode('initial')}
                       className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100"
                     >
                       Back to Settings
                     </button>
                   </div>
                 ) : (
                   <>
                     <div className="text-center">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dna-primary/20 mb-4">
                         <div className="animate-spin">
                           <svg className="w-8 h-8 text-dna-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                           </svg>
                         </div>
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">{progress.message}</h3>
                       <p className="text-gray-400">
                         Story {progress.storyIndex + 1} of {progress.totalStories} • Iteration {progress.iterationCount}
                       </p>
                     </div>
                   </>
                 )}

                {!hasError && (
                  <>
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-white">Overall Progress</span>
                        <span className="text-sm text-dna-primary font-bold">{progress.totalStories}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${(progress.storyIndex / progress.totalStories) * 100}%` }}
                          className="h-full bg-gradient-to-r from-dna-primary to-dna-secondary"
                        />
                      </div>
                    </div>

                    {/* Learnings Log */}
                    {progress.learnings.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4 max-h-48 overflow-y-auto">
                        <h4 className="font-bold text-white mb-3 text-sm">📚 Learnings</h4>
                        <div className="space-y-2">
                          {progress.learnings.slice(-5).map((learning, idx) => (
                            <p key={idx} className="text-xs text-gray-300 leading-relaxed">
                              {learning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assets Preview */}
                    {progress.assets.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4 max-h-40 overflow-y-auto">
                        <h4 className="font-bold text-white mb-2 text-sm">Generated Assets</h4>
                        <div className="space-y-1">
                          {progress.assets.map((asset) => (
                            <div key={asset.id} className="text-xs text-gray-300">
                              ✓ {asset.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {mode === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6 py-8"
              >
                <div>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-black text-white mb-2">Campaign Complete!</h3>
                  <p className="text-gray-400">All {prdProgress.total} stories executed successfully</p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Total Iterations</span>
                    <span className="font-bold text-white">{state.currentIteration}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Assets Generated</span>
                    <span className="font-bold text-white">{progress.assets.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Learnings Saved</span>
                    <span className="font-bold text-dna-secondary">{state.learnings.length}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-gray-100"
                >
                  View Campaign Results
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AutonomousCampaignMode;
