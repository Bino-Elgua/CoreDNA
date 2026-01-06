import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedCampaign } from '../types';

interface SavedCampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCampaigns: SavedCampaign[];
  onLoad: (campaign: SavedCampaign) => void;
  onDelete: (id: string) => void;
}

const SavedCampaignsModal: React.FC<SavedCampaignsModalProps> = ({ 
  isOpen, onClose, savedCampaigns, onLoad, onDelete 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Saved Campaigns</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {savedCampaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No saved campaigns found.</p>
                <p className="text-sm mt-2">Generate a campaign and click "Save" to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedCampaigns.map(campaign => (
                  <div key={campaign.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-dna-primary dark:hover:border-dna-primary transition-all bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center group">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{campaign.dna.name || 'Untitled Brand'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{campaign.goal}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(campaign.timestamp).toLocaleDateString()} at {new Date(campaign.timestamp).toLocaleTimeString()}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onLoad(campaign)}
                        className="px-4 py-2 text-sm bg-dna-primary text-white rounded-lg hover:bg-dna-secondary transition-colors"
                      >
                        Load
                      </button>
                      <button 
                        onClick={() => onDelete(campaign.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SavedCampaignsModal;