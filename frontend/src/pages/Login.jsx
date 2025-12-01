import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

// Blob SVG Component
const Blob = ({ className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0.8, 1, 0.8],
      scale: [0.8, 1, 0.8],
      x: [0, 10, 0],
      y: [0, 10, 0],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    className={`absolute rounded-full filter blur-3xl opacity-20 ${className}`}
  />
);

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, signIn, signUp } = useAppContext();
  const navigate = useNavigate();

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLogin && !name.trim()) {
      setError("Name is required");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { success } = await signIn(email, password);
        if (success) navigate('/dashboard');
      } else {
        const { success, error: signUpError } = await signUp(email, password, name);
        if (success) {
          setError('success:Check your email to verify your account!');
          setIsLogin(true);

          setName('');
          setEmail('');
          setPassword('');
        } else if (signUpError) {
          setError(signUpError.message || 'Failed to create account');
        }
      }
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // ANIMATION VARIANTS (no logic issues)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden relative">
      
      <Blob className="bg-blue-600 w-80 h-80 -top-40 -left-40" />
      <Blob className="bg-purple-600 w-96 h-96 -bottom-40 -right-40" />
      <Blob className="bg-pink-600 w-72 h-72 top-1/2 right-1/4" />
      
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black/80 backdrop-blur-sm" />

      <motion.div 
        className="relative z-10 w-full max-w-md px-6 py-12 sm:px-12 bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        
        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={isLogin ? "login" : "signup"}
        >

          <motion.div variants={itemVariants} className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                {isLogin ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                )}
              </div>
            </div>

            <motion.h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400" variants={itemVariants}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </motion.h2>

            <motion.p className="mt-2 text-gray-400 text-sm" variants={itemVariants}>
              {isLogin ? "Sign in to access your account" : "Join us today and boost your productivity"}
            </motion.p>
          </motion.div>

          {error && (
            <motion.div 
              className={`p-4 rounded-lg ${error.startsWith('success:') 
                ? 'bg-green-900/50 border-l-4 border-green-500' 
                : 'bg-red-900/50 border-l-4 border-red-500'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className={`text-sm ${error.startsWith('success:') ? 'text-green-200' : 'text-red-200'}`}>
                {error.startsWith('success:') ? error.substring(8) : error}
              </p>
            </motion.div>
          )}

          {/* FORM */}
          <motion.form className="space-y-6" onSubmit={handleSubmit} variants={itemVariants}>
            
            <motion.div variants={itemVariants} className="space-y-4">
              
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

            </motion.div>

            {!isLogin && (
              <motion.div variants={itemVariants} className="flex items-center">
                <input type="checkbox" required className="h-4 w-4 text-blue-600 rounded" />
                <label className="ml-2 text-sm text-gray-300">
                  I agree to Terms & Privacy Policy
                </label>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                {loading
                  ? isLogin ? "Signing in..." : "Creating account..."
                  : isLogin ? "Sign in" : "Create Account"}
              </button>
            </motion.div>

          </motion.form>

          <motion.div className="text-center text-sm text-gray-400" variants={itemVariants}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setIsLogin(!isLogin);
                setName("");
                setEmail("");
                setPassword("");
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </motion.div>

        </motion.div>

      </motion.div>
    </div>
  );
};

export default Login;
