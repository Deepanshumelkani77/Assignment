import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Star, Check, AlertTriangle, Code as CodeIcon, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

// Function to load Razorpay script
const loadRazorpay = () => {
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  return new Promise((resolve, reject) => {
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

    loadScript(
      `https://checkout.razorpay.com/v1/checkout.js?t=${Date.now()}`,
      onLoad,
      () => {
        loadScript(
          'https://checkout.razorpay.com/v1/checkout.js',
          onLoad,
          onError
        );
      }
    );
  });
};

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedReports, setExpandedReports] = useState({});
  const { user, profile, refreshProfile } = useAppContext();
  const isUserPremium = profile?.is_premium || false;
  const navigate = useNavigate();
  
  const toggleReport = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const toggleSection = (reportId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${reportId}_${section}`]: !prev[`${reportId}_${section}`]
    }));
  };

  const isSectionExpanded = (reportId, section) => {
    return expandedSections[`${reportId}_${section}`] || false;
  };

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'text-green-400';
    if (numScore >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreFeedback = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'Excellent code quality!';
    if (numScore >= 6) return 'Good, but has room for improvement';
    return 'Needs significant improvements';
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('user_id', user.id)  // Only fetch reports for the current user
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-lg text-red-200 text-center">
        {error}
      </div>
    );
  }

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/reports' } });
      return;
    }

    try {
      setIsProcessing(true);
      const amount = 299; // 299 INR in paise
      
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
            
            // Refresh profile data
            await refreshProfile();
            
            // Show success message
            alert('Payment successful! You now have access to all premium features.');
          } catch (err) {
            console.error('Error updating premium status:', err);
            alert('Payment was successful but there was an error updating your account. Please contact support.');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300">No reports yet</h3>
        <p className="mt-1 text-gray-500">Submit your first code for evaluation to see your reports here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          {isUserPremium ? 'My Premium Reports' : 'My Reports'}
        </h2>
        <p className="text-gray-400">
          {isUserPremium 
            ? 'View and analyze your complete evaluation history' 
            : 'Upgrade to premium to unlock detailed reports and analysis'}
        </p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-colors"
          >
            <div className="p-6">
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {report.title || 'Untitled Evaluation'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Evaluated on {formatDate(report.created_at)}
                  </p>
                  <div className="mt-2 flex items-center">
                    <div className={`text-3xl font-bold ${getScoreColor(report.score)}`}>
                      {report.score?.toFixed(1) || 'N/A'}
                      <span className="text-sm text-gray-400 ml-1">/10</span>
                    </div>
                    <div className="ml-4 text-sm text-gray-300">
                      {getScoreFeedback(report.score)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-blue-400">Strengths</h4>
                  {isUserPremium && report.strengths?.length > 3 && (
                    <button 
                      onClick={() => toggleReport(report.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {expandedReports[report.id] ? 'Show Less' : `Show All (${report.strengths.length})`}
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {report.strengths?.slice(0, expandedReports[report.id] ? report.strengths.length : 3).map((strength, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5"></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-300">
                        {strength}
                      </span>
                    </motion.li>
                  ))}
                  {!isUserPremium && report.strengths?.length > 3 && (
                    <li className="text-xs text-blue-400 mt-2">
                      +{report.strengths.length - 3} more strengths available with premium
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-orange-400">Areas for Improvement</h4>
                  {isUserPremium && report.improvements?.length > 3 && (
                    <button 
                      onClick={() => toggleReport(report.id)}
                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      {expandedReports[report.id] ? 'Show Less' : `Show All (${report.improvements.length})`}
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {report.improvements?.slice(0, expandedReports[report.id] ? report.improvements.length : 3).map((improvement, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5"></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-300">
                        {improvement}
                      </span>
                    </motion.li>
                  ))}
                  {!isUserPremium && report.improvements?.length > 3 && (
                    <li className="text-xs text-blue-400 mt-2">
                      +{report.improvements.length - 3} more improvements available with premium
                    </li>
                  )}
                </ul>
              </div>

              {/* Detailed Analysis Section - Only for premium users */}
              {isUserPremium && (
                <div className="mt-6 space-y-6">
                  {/* Detailed Code Analysis */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection(report.id, 'codeAnalysis')}
                      className="flex items-center justify-between w-full text-left text-lg font-semibold text-white"
                    >
                      <span className="flex items-center">
                        <CodeIcon className="w-5 h-5 text-blue-400 mr-2" />
                        Detailed Code Analysis
                      </span>
                      {isSectionExpanded(report.id, 'codeAnalysis') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isSectionExpanded(report.id, 'codeAnalysis') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                            <p className="text-gray-300">
                              {report.analysis?.codeAnalysis || 'Your code demonstrates solid understanding of core concepts. The structure is clean and follows best practices. The use of modern JavaScript features and proper component composition is commendable.'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Performance Analysis */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection(report.id, 'performance')}
                      className="flex items-center justify-between w-full text-left text-lg font-semibold text-white"
                    >
                      <span className="flex items-center">
                        <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                        Performance Analysis
                      </span>
                      {isSectionExpanded(report.id, 'performance') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isSectionExpanded(report.id, 'performance') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-700/30 border-l-4 border-yellow-500 p-4">
                            <h4 className="font-medium text-yellow-300 mb-2">Performance Insights</h4>
                            <p className="text-sm text-gray-300">
                              {report.analysis?.performance || 'Your code performs well, but there are opportunities to optimize rendering performance by implementing React.memo for expensive components and using useCallback for event handlers passed as props.'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Security Assessment */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection(report.id, 'security')}
                      className="flex items-center justify-between w-full text-left text-lg font-semibold text-white"
                    >
                      <span className="flex items-center">
                        <Lock className="w-5 h-5 text-green-400 mr-2" />
                        Security Assessment
                      </span>
                      {isSectionExpanded(report.id, 'security') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isSectionExpanded(report.id, 'security') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-700/30 border-l-4 border-green-500 p-4">
                            <h4 className="font-medium text-green-300 mb-2">Security Findings</h4>
                            <p className="text-sm text-gray-300">
                              {report.analysis?.security || 'Good job on implementing proper data validation and sanitization. No major security vulnerabilities were detected in the code review.'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Implementation Recommendations */}
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection(report.id, 'recommendations')}
                      className="flex items-center justify-between w-full text-left text-lg font-semibold text-white"
                    >
                      <span className="flex items-center">
                        <Check className="w-5 h-5 text-purple-400 mr-2" />
                        Implementation Recommendations
                      </span>
                      {isSectionExpanded(report.id, 'recommendations') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isSectionExpanded(report.id, 'recommendations') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-700/30 border-l-4 border-purple-500 p-4">
                            <h4 className="font-medium text-purple-300 mb-2">Recommended Actions</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                              {report.recommendations?.length > 0 ? (
                                report.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                                    </div>
                                    <span className="ml-2">{rec}</span>
                                  </li>
                                ))
                              ) : (
                                <>
                                  <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                                    </div>
                                    <span className="ml-2">Implement error boundaries to catch and handle component errors gracefully.</span>
                                  </li>
                                  <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                                    </div>
                                    <span className="ml-2">Add proper loading states for async operations to improve user experience.</span>
                                  </li>
                                  <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                                    </div>
                                    <span className="ml-2">Consider adding prop-types or TypeScript for better type safety and documentation.</span>
                                  </li>
                                  <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                                    </div>
                                    <span className="ml-2">Implement proper error handling for API calls and network requests.</span>
                                  </li>
                                  <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                                    </div>
                                    <span className="ml-2">Add unit tests to ensure code reliability and prevent regressions.</span>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Upgrade Prompt for Non-Premium Users */}
              {!isUserPremium && (
                <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/30 mb-3">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">Unlock Full Report</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Upgrade to premium to access detailed analysis and {report.analysis ? 'all' : report.strengths?.length + report.improvements?.length} insights
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleUpgrade}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-1.5" />
                          Upgrade to Premium
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => window.location.href = '/upgrade'}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <Lock className="w-4 h-4 mr-1.5" />
                      View Plans
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReportsList;
