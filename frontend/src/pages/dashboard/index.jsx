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
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSignOut={signOut}
        user={user}
        profile={profile}
      />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
