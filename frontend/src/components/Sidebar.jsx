import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Upload, FileText, LogOut, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, onSignOut, user, profile }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Navigation items
  const navItems = [
    { id: 'upload', icon: <Upload size={18} />, label: 'Upload Code' },
    { id: 'reports', icon: <FileText size={18} />, label: 'My Reports' },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle navigation
  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-300" />
          )}
        </button>
      )}
      
      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={isMobile ? { x: -300, opacity: 0 } : {}}
            animate={isMobile ? { x: 0, opacity: 1 } : {}}
            exit={isMobile ? { x: -300, opacity: 0 } : {}}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed md:relative z-40 w-72 bg-gray-900/95 md:bg-gray-900/40 backdrop-blur-lg border-r border-gray-800/50 flex flex-col h-screen md:h-full"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
            
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-800/50 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-xl">👨‍💻</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    CodeEval AI
                  </h2>
                  <p className="text-xs text-gray-400">Professional Code Review</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 mt-2 relative z-10 overflow-y-auto">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <motion.li key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white shadow-lg shadow-blue-500/10 backdrop-blur-sm border border-white/10'
                          : 'text-gray-400 hover:bg-gray-800/30 hover:text-white hover:bg-gradient-to-r hover:from-white/5 hover:to-white/5'
                      }`}
                    >
                      <span className={`${activeTab === item.id ? 'text-blue-400' : ''}`}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                      {activeTab === item.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute right-4 w-1.5 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* User profile */}
            <div className="p-4 border-t border-gray-800/50 relative z-10 mt-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-3 p-3 rounded-xl bg-black/30 backdrop-blur-sm border border-white/5 group-hover:border-white/10 transition-all duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center relative">
                      <User size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {profile?.is_premium ? 'Premium Member' : 'Free Account'}
                    </p>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    title="Sign out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
