import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, onSignOut, user, profile }) => {
  const navItems = [
    { id: 'upload', icon: '📤', label: 'Upload Code' },
    { id: 'reports', icon: '📋', label: 'My Reports' },
  ];

  return (
    <div className="w-20 md:w-64 bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-center md:justify-start space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-xl">👨‍💻</span>
          </div>
          <div className="hidden md:block">
            <h2 className="font-bold text-lg">CodeEval AI</h2>
            <p className="text-xs text-gray-400">Professional Code Review</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 mt-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-4 border-blue-500'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="hidden md:inline text-sm font-medium">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-lg">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden md:block flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-400">
              {profile?.is_premium ? 'Premium Plan' : 'Free Plan'}
              {profile?.is_premium && <span className="ml-1 text-yellow-400">★</span>}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
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
  );
};

export default Sidebar;
