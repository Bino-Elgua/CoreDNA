import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CampaignAsset, BrandDNA } from '../types';
import { healAsset, healAssetBatch, getHealingStats, AssetValidationResult } from '../services/selfHealingService';

interface SelfHealingPanelProps {
  assets: CampaignAsset[];
  dna: BrandDNA;
  onAssetsHealed: (assets: CampaignAsset[]) => void;
}

const SelfHealingPanel: React.FC<SelfHealingPanelProps> = ({
  assets,
  dna,
  onAssetsHealed
}) => {
  const [isHealing, setIsHealing] = useState(false);
  const [progress, setProgress] = useState('');
  const [healingResults, setHealingResults] = useState<{
    healed: CampaignAsset[];
    failures: { asset: CampaignAsset; reason: string }[];
  } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<CampaignAsset | null>(null);

  const handleHealAll = async () => {
    if (assets.length === 0) {
      alert('No assets to heal');
      return;
    }

    setIsHealing(true);
    setProgress('Analyzing assets...');
    setHealingResults(null);

    try {
      const results = await healAssetBatch(
        assets,
        dna,
        3,
        (msg) => setProgress(msg)
      );

      setHealingResults(results);
      onAssetsHealed(results.healed);
      setProgress(`✓ Healing complete: ${results.healed.length} healed, ${results.failures.length} failed`);
    } catch (error: any) {
      alert(`Healing failed: ${error.message}`);
      setProgress('');
    } finally {
      setIsHealing(false);
    }
  };

  const handleHealSelected = async () => {
    if (!selectedAsset) {
      alert('Select an asset to heal');
      return;
    }

    setIsHealing(true);
    setProgress('Healing selected asset...');

    try {
      const result = await healAsset(selectedAsset, dna, undefined, 3, (msg) => setProgress(msg));

      if (result.healing.length > 0) {
        const healingStats = getHealingStats(result.healing);
        alert(
          `Healing Results:\n` +
          `Attempts: ${healingStats.totalAttempts}\n` +
          `Success Rate: ${healingStats.healingRate.toFixed(0)}%\n` +
          `Avg Score: ${healingStats.avgScore}/100`
        );
        onAssetsHealed([result.asset]);
      }
    } catch (error: any) {
      alert(`Healing failed: ${error.message}`);
    } finally {
      setIsHealing(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              🔧 Self-Healing Loop
            </h3>
            <p className="text-sm text-gray-400 mt-1">Auto-fix underperforming assets recursively</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleHealAll}
            disabled={isHealing || assets.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider disabled:opacity-50 transition-all"
          >
            {isHealing ? `🔄 ${progress || 'Healing...'}` : `🔄 Heal All ${assets.length} Assets`}
          </button>

          {assets.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Or select an asset to heal
              </label>
              <select
                value={selectedAsset?.id || ''}
                onChange={(e) => {
                  const asset = assets.find(a => a.id === e.target.value);
                  setSelectedAsset(asset || null);
                }}
                className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-purple-500 outline-none"
              >
                <option value="">Select an asset...</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.title}
                  </option>
                ))}
              </select>

              <button
                onClick={handleHealSelected}
                disabled={isHealing || !selectedAsset}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs uppercase disabled:opacity-50 transition-all"
              >
                Heal Selected
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {healingResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Success */}
            {healingResults.healed.length > 0 && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-4">
                <h4 className="font-bold text-green-300 mb-3">✓ Successfully Healed ({healingResults.healed.length})</h4>
                <div className="space-y-2">
                  {healingResults.healed.map(asset => (
                    <div key={asset.id} className="bg-black/30 p-3 rounded-lg border-l-2 border-green-500">
                      <p className="text-sm font-bold text-white">{asset.title}</p>
                      {asset.notes && (
                        <p className="text-xs text-gray-400 mt-1">{asset.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failures */}
            {healingResults.failures.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
                <h4 className="font-bold text-red-300 mb-3">✗ Failed to Heal ({healingResults.failures.length})</h4>
                <div className="space-y-2">
                  {healingResults.failures.map((failure, idx) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg border-l-2 border-red-500">
                      <p className="text-sm font-bold text-white">{failure.asset.title}</p>
                      <p className="text-xs text-red-300 mt-1">{failure.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setHealingResults(null)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold uppercase"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelfHealingPanel;
