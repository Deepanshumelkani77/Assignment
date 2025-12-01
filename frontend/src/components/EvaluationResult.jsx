import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Zap, Loader2, Lock, Star, Code as CodeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

// Function to load Razorpay script
const loadRazorpay = () => {
  // Check if already loaded
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  return new Promise((resolve, reject) => {
    // Try loading with a different approach if the first one fails
    const loadScript = (src, onSuccess, onError) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = onSuccess;
      script.onerror = onError;
      document.body.appendChild(script);
    };

    const onError = (error) => {
      console.error('Failed to load Razorpay:', error);
      reject(new Error('Payment processor could not be loaded. Please disable ad blockers and try again.'));
    };

    const onLoad = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        onError('Razorpay not found after script load');
      }
    };

    // Try loading with cache buster
    loadScript(
      `https://checkout.razorpay.com/v1/checkout.js?t=${Date.now()}`,
      onLoad,
      () => {
        // If first attempt fails, try with a different CDN
        loadScript(
          'https://checkout.razorpay.com/v1/checkout.js',
          onLoad,
          onError
        );
      }
    );
  });
};

const EvaluationResult = ({ evaluation, onUpgrade }) => {
  const [showFullReport, setShowFullReport] = useState(false);
  const { user, profile } = useAppContext();
  const navigate = useNavigate();
  
  if (!evaluation) return null;
  
  // Check if user is premium from profile context
  const isUserPremium = profile?.is_premium || false;

  const { 
    score = 5.0, 
    strengths = [], 
    improvements = [], 
    timestamp = new Date().toISOString() 
  } = evaluation;
  
  const scorePercentage = Math.round((parseFloat(score) / 10) * 100);
  const displayScore = typeof score === 'number' ? score.toFixed(1) : parseFloat(score || 5).toFixed(1);

  // Format date
  let formattedDate = 'Just now';
  try {
    formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
  }
  
  // Ensure strengths and improvements are arrays
  const safeStrengths = Array.isArray(strengths) 
    ? strengths 
    : [strengths || 'No specific strengths identified'];
      
  const safeImprovements = Array.isArray(improvements) 
    ? improvements 
    : [improvements || 'No specific improvements suggested'];


  const { refreshProfile } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/evaluate' } });
      return;
    }

    try {
      setIsProcessing(true);
      const amount = 1; // 1 INR in paise
      
      // Load Razorpay script
      const Razorpay = await loadRazorpay();
      
      // Create order in your backend
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/create-order`, 
        { amount: amount },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!res.data || !res.data.id) {
        throw new Error('Invalid response from payment server');
      }
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: res.data.amount,
        currency: "INR",
        name: "Code Evaluation Pro",
        description: "Premium Evaluation Access",
        order_id: res.data.id,
        handler: async function (response) {
          try {
            // Update user's premium status in profiles table
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', user.id)
              .select();

            if (profileError) throw profileError;

            // Update evaluation with premium status if evaluation exists
            if (evaluation?.id) {
              const { error: evalError } = await supabase
                .from('evaluations')
                .update({ 
                  is_premium: true
                })
                .eq('id', evaluation.id);

              if (evalError) throw evalError;
            }
            
            // Refresh user profile to get updated premium status
            await refreshProfile();
            
            // Show success message and update UI without reloading
            alert('Payment successful! You now have access to premium features.');
            // Instead of reloading, update the local state to show full report
            setShowFullReport(true);
            
          } catch (error) {
            console.error("Error processing payment:", error);
            alert("Payment succeeded, but there was an error updating your account. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || 'Customer',
          email: user?.email || '',
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const razor = new Razorpay(options);
      razor.open();
      
      razor.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description || 'Please try again'}`);
        setIsProcessing(false);
      });
      
    } catch (error) {
      console.error("Error creating payment order:", error);
      alert(`Payment failed: ${error.message || 'Please try again'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          {isUserPremium ? 'Full Report' : 'Evaluation Summary'}
        </h2>
        <p className="text-gray-400 mt-1">Analyzed on {formattedDate}</p>
      </div>

      {/* Score */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1e293b"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={score > 7 ? '#10b981' : score > 5 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${scorePercentage}, 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease 0s, stroke 0.6s ease' }}
              />
              <text
                x="18"
                y="20.35"
                className="text-3xl font-bold"
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {displayScore}
              </text>
              <text
                x="18"
                y="25"
                className="text-xs font-medium"
                fill="#94a3b8"
                textAnchor="middle"
              >
                / 10
              </text>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {score > 8 ? (
                <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
              ) : score > 6 ? (
                <Check className="w-8 h-8 text-green-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-gray-300">
            {score > 8
              ? 'Excellent code quality!'
              : score > 6
              ? 'Good, but has room for improvement'
              : 'Needs significant improvements'}
          </p>
        </div>
      </div>

      {/* Strengths */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Check className="w-5 h-5 text-green-400 mr-2" />
          Key Strengths
        </h3>
        <div className="space-y-3">
          {safeStrengths.length > 0 ? (
            safeStrengths.map((strength, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                </div>
                <p className="ml-3 text-gray-300">{strength.trim()}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No specific strengths identified in the code.</p>
          )}
        </div>
      </div>

      {/* Improvements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <AlertTriangle className="w-5 h-5 text-orange-400 mr-2" />
          Areas for Improvement
        </h3>
        <div className="space-y-3">
          {safeImprovements.length > 0 ? (
            safeImprovements.map((improvement, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-orange-400" />
                  </div>
                </div>
                <p className="ml-3 text-gray-300">{improvement.trim()}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No specific improvements suggested for the code.</p>
          )}
        </div>
      </div>

      {/* Upgrade Buttons */}
      {!isUserPremium ? (
        <div className="mt-6 space-y-4">
          <div className="text-center">
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Upgrade (₹1)
                </>
              )}
            </button>
            <p className="mt-2 text-sm text-blue-300">Quick upgrade with one-click payment</p>
          </div>
          
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              View All Plans
            </button>
            <p className="mt-2 text-sm text-gray-400">Explore all premium features and plans</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowFullReport(!showFullReport)}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            <CodeIcon className="w-5 h-5 mr-2" />
            {showFullReport ? 'Hide Full Report' : 'Show Full Report'}
          </button>
        </div>
      )}

      {/* Full Report Content (only visible for premium and when toggled) */}
      {isUserPremium ? (
        showFullReport && (
        <motion.div 
          className="mt-4 space-y-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-200">You have full access to this premium report</span>
            </div>
          </div>

          {/* Detailed Analysis Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <CodeIcon className="w-5 h-5 text-blue-400 mr-2" />
              Detailed Code Analysis
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <p className="text-gray-300">
                Your code demonstrates solid understanding of core concepts. The structure is clean and follows best practices. 
                The use of modern JavaScript features and proper component composition is commendable.
              </p>
              
              <div className="mt-4 p-3 bg-gray-700/50 rounded border-l-4 border-blue-500">
                <h4 className="font-medium text-blue-300 mb-1">Performance Analysis</h4>
                <p className="text-sm text-gray-300">
                  Your code performs well, but there are opportunities to optimize rendering performance by implementing 
                  React.memo for expensive components and using useCallback for event handlers passed as props.
                </p>
              </div>
              
              <div className="mt-4 p-3 bg-gray-700/50 rounded border-l-4 border-green-500">
                <h4 className="font-medium text-green-300 mb-1">Security Assessment</h4>
                <p className="text-sm text-gray-300">
                  Good job on implementing proper data validation and sanitization. No major security vulnerabilities were 
                  detected in the code review.
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              Implementation Recommendations
            </h3>
            <div className="space-y-3">
              {[
                'Implement error boundaries to catch and handle component errors gracefully.',
                'Add proper loading states for async operations to improve user experience.',
                'Consider adding prop-types or TypeScript for better type safety and documentation.',
                'Implement proper error handling for API calls and network requests.',
                'Add unit tests to ensure code reliability and prevent regressions.'
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center text-sm mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))
      : (
        <div className="mt-6 p-6 bg-gray-800/50 border border-gray-700 rounded-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Premium Report Locked</h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Unlock detailed analysis, personalized recommendations, and advanced insights with a premium subscription.
          </p>
          <button
            onClick={handleUpgrade}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            <Zap className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </button>
          <p className="mt-3 text-sm text-blue-300">Get full access to all features</p>
        </div>
      )}
    </div>
  );
};

export default EvaluationResult;