import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserProfileCardProps {
  user?: UserProfile;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  if (!user) {
    return null;
  }
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security' | 'data'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });

  const handleSave = () => {
    const updated: UserProfile = { ...user, ...formData };
    localStorage.setItem('core_dna_user', JSON.stringify(updated));
    setIsEditing(false);
  };

  const tierColors = {
    free: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', badge: 'bg-gray-500' },
    pro: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-500' },
    hunter: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500' },
    agency: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-600' }
  };

  const tier = tierColors[user.tier];
  const accountCreated = new Date(localStorage.getItem(`user_created_${user.id}`) || Date.now()).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-600 shadow-md"
            />
            <div className="flex-1">
              {isEditing && activeTab === 'overview' ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-bold text-lg"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold font-display">{user.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-2">Member since {accountCreated}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <span className={`px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider ${tier.badge}`}>
              {user.tier}
            </span>
            <p className="text-xs text-gray-400">ID: {user.id.substring(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '👤' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'data', label: 'Data & Privacy', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-dna-primary text-dna-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Account Tier</p>
                    <p className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{user.tier}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Member Since</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{accountCreated}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Upgrade Path</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {user.tier === 'free' && 'Upgrade to Pro for advanced AI features including RLM, inference optimizations, and workflow access.'}
                    {user.tier === 'pro' && 'Upgrade to Hunter for automation control: edit workflows, schedule posts, and customize integrations.'}
                    {user.tier === 'hunter' && 'Upgrade to Agency (Contact Sales) for team management, white-label, bulk extraction, and dedicated support.'}
                    {user.tier === 'agency' && 'You have all features unlocked including team management, white-label, bulk extraction, and priority support.'}
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-bold text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates on campaigns and extractions</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Marketing Emails</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to know about new features</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 cursor-pointer" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Usage Analytics</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Help improve the product with usage data</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full px-4 py-3 bg-dna-primary hover:opacity-90 text-white rounded-lg font-bold transition-opacity flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Go to Full Settings
                  </button>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="font-bold text-green-900 dark:text-green-300 flex items-center gap-2">
                    <span className="text-lg">✓</span> Account Status
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">Your account is secure and verified</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                      <span className="text-xs px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">Disabled</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Add an extra layer of security to your account</p>
                    <button className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="font-bold text-gray-900 dark:text-white mb-3">Change Password</p>
                    <button className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                      Update Password
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">Active Sessions</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">1 active session</p>
                    <button className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                      Sign Out All Devices
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="font-bold text-blue-900 dark:text-blue-300 mb-2">Data Control</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Manage your personal data and privacy preferences. We store your brand profiles and settings securely.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">Download Your Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Export all your profiles, campaigns, and settings as JSON</p>
                    <button className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Data
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Review our data privacy and protection practices</p>
                    <a href="#" className="text-blue-500 hover:underline text-sm font-bold">View Privacy Policy →</a>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="font-bold text-red-900 dark:text-red-300 mb-2">Delete Account</p>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-3">Permanently delete your account and all associated data</p>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure? This cannot be undone.')) {
                          alert('Account deletion initiated. Check your email for confirmation.');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Button */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to log out?')) {
              logout();
            }
          }}
          className="flex-1 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </motion.div>
  );
};

export default UserProfileCard;
