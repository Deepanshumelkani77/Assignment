import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/index';
import Upgrade from './pages/Upgrade';
import PremiumRoute from './components/PremiumRoute';

const App = () => {
  const { user, loading, profile } = useAppContext();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    // Only show loading for the first 2 seconds max
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner only if we're still loading and it's the initial load
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black/90 to-black/80">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-75 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-20 h-20 bg-black/80 rounded-full border border-gray-800">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Loading your workspace...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black/90 to-black/80 text-gray-100">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/upgrade" 
          element={
            user ? (
              <Upgrade />
            ) : (
              <Navigate to="/login" state={{ from: '/upgrade' }} replace />
            )
          } 
        />
        
        {/* Protected premium routes */}
        <Route 
          path="/premium/*" 
          element={
            <PremiumRoute>
              <Dashboard />
            </PremiumRoute>
          } 
        />
        
        {/* Regular dashboard route */}
        <Route 
          path="/dashboard/*" 
          element={
            user ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" state={{ from: '/dashboard' }} replace />
            )
          } 
        />
        
        <Route 
          path="/" 
          element={
            <Navigate to={
              user ? 
                (profile?.is_premium ? 
                  "/premium" : 
                  "/dashboard") : 
                "/login"
            } replace /> 
          } 
        />
      </Routes>
    </div>
  );
};

export default App;
