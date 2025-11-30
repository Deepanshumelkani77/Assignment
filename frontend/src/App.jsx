import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/index';
import Upgrade from './pages/Upgrade';
import PremiumRoute from './components/PremiumRoute';

const App = () => {
  const { user, loading, profile } = useAppContext();
  
  console.log('App render - user:', user, 'loading:', loading, 'profile:', profile);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
