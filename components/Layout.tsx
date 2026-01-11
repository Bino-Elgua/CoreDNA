
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../hooks/useBranding';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const { name: appName, logo, isWhiteLabel } = useBranding();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/extract', label: 'Extract DNA', icon: '🧬' },
    { path: '/battle', label: 'Battle Mode', icon: '⚔️' },
    { path: '/sonic', label: 'Sonic Lab', icon: '🔊' },
    { path: '/campaigns', label: 'Campaigns', icon: '🚀' },
    { path: '/scheduler', label: 'Scheduler', icon: '📅' },
    { path: '/builder', label: 'Site Builder', icon: '🏗️' },
    { path: '/agent-forge', label: 'Agent Forge', icon: '🛠️' },
    { path: '/automations', label: 'Automations', icon: '⚡', tier: 'hunter', tooltip: 'Advanced: View & customize workflows (Hunter+ tiers)' },
    { path: '/affiliate', label: 'Affiliate Hub', icon: '🏢', tier: 'agency', tooltip: 'Agency Tier: Earn 20% recurring commission' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark' : ''} bg-[#050b18] text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="h-screen z-50 bg-white dark:bg-[#0a1120] border-r border-gray-200 dark:border-white/10 flex flex-col transition-colors duration-300 shadow-2xl flex-shrink-0 relative"
      >
        {/* Sidebar Header - Acts as Collapse Trigger */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-24 flex items-center px-4 overflow-hidden flex-shrink-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          <div className="flex items-center gap-3 w-full">
            {isWhiteLabel && logo ? (
                <img src={logo} alt={appName} className="h-8 w-8 object-contain rounded-md" />
            ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-dna-secondary to-dna-primary flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                  {appName.charAt(0)}
                </div>
            )}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="text-lg font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 truncate">
                    {appName}
                  </span>
                  <span className="text-[9px] font-black tracking-widest text-dna-primary">Design Narrative Assistant</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-grow px-3 py-4 flex flex-col justify-between overflow-hidden">
          <nav className="space-y-1 overflow-y-auto custom-scrollbar flex-grow">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                title={isCollapsed ? item.label : ''}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive(item.path) 
                  ? 'bg-dna-primary text-white font-bold shadow-lg shadow-dna-primary/20' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
             {!isCollapsed && (
               <div className="px-3 mb-4">
                 <button 
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-dna-primary transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <span className="text-xs font-bold uppercase tracking-widest">Theme</span>
                  <span>{darkMode ? '☀️' : '🌙'}</span>
                </button>
               </div>
             )}
            {user ? (
               <div 
                onClick={logout}
                className="flex items-center gap-4 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-all overflow-hidden"
                title="Sign Out"
               >
                 <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 flex-shrink-0" />
                 {!isCollapsed && (
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <p className="text-[10px] text-dna-primary font-bold uppercase">{user.tier} Tier</p>
                    </div>
                 )}
               </div>
            ) : (
               <button 
                onClick={login}
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
               >
                 {isCollapsed ? '👤' : 'Sign In'}
               </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area - Full Immersive Blue Gradient */}
       <main className="flex-grow transition-all duration-300 relative flex flex-col">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             <div className="absolute inset-0 bg-[#050b18] bg-gradient-to-br from-[#0a1931] via-[#050b18] to-[#0d2142]" />
             <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[140px]" />
             <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-dna-primary/10 rounded-full blur-[120px]" />
          </div>
         
         <div className="relative z-10 w-full h-auto overflow-y-auto custom-scrollbar p-4 md:p-8">
           {children}
         </div>
       </main>
    </div>
  );
};

export default Layout;
