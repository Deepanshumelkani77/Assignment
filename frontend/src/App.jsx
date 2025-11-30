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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-300">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
