import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, onSignOut, user, profile }) => {
  const navItems = [
    { id: 'upload', icon: '📤', label: 'Upload Code' },
    { id: 'reports', icon: '📋', label: 'My Reports' },
  ];

  return (
    <div className="w-20 md:w-72 bg-black/40 backdrop-blur-lg border-r border-gray-800/50 flex flex-col h-full relative overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
      
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-800/50 relative z-10">
        <div className="flex items-center justify-center md:justify-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-xl">👨‍💻</span>
          </div>
          <div className="hidden md:block">
            <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              CodeEval AI
            </h2>
            <p className="text-xs text-gray-400">Professional Code Review</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 mt-2 relative z-10">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <motion.li 
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white shadow-lg shadow-blue-500/10 backdrop-blur-sm border border-white/10'
                    : 'text-gray-400 hover:bg-gray-800/30 hover:text-white hover:bg-gradient-to-r hover:from-white/5 hover:to-white/5'
                }`}
              >
                <span className={`text-xl ${activeTab === item.id ? 'text-blue-400' : ''}`}>
                  {item.icon}
                </span>
                <span className="hidden md:inline text-sm font-medium">
                  {item.label}
                </span>
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

      <div className="p-4 border-t border-gray-800/50 relative z-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-3 p-3 rounded-xl bg-black/30 backdrop-blur-sm border border-white/5 group-hover:border-white/10 transition-all duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center relative">
                <span className="text-lg font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="hidden md:block flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">
                {user?.email || 'User'}
              </p>
              <div className="flex items-center">
                <span className="text-xs bg-gradient-to-r from-blue-400/80 to-purple-400/80 text-transparent bg-clip-text">
                  {profile?.is_premium ? 'Premium Member' : 'Free Plan'}
                </span>
                {profile?.is_premium && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] rounded-full flex items-center">
                    <span className="text-yellow-400 mr-1">★</span> PRO
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:rotate-12"
              title="Sign out"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
