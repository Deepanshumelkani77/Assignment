import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import CodeUpload from '../../components/CodeUpload';
import ReportsList from '../../components/ReportsList';
import Sidebar from '../../components/Sidebar';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const { user, signOut, profile } = useAppContext();

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <CodeUpload />;
      case 'reports':
        return <ReportsList />;
      default:
        return <CodeUpload />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-black via-black/90 to-black/80 text-gray-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/5 to-transparent opacity-30"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/5 to-transparent opacity-30"></div>
      </div>
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSignOut={signOut}
        user={user}
        profile={profile}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Content header with gradient accent */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            {/* Main content area */}
            <div className="p-6 md:p-8">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </div>
          </motion.div>
          
          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <p>© {new Date().getFullYear()} CodeEval AI. All rights reserved.</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
