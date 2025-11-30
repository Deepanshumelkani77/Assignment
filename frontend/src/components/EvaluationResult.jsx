import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Lock, Star, Zap, Code as CodeIcon } from 'lucide-react';

const EvaluationResult = ({ evaluation, onUpgrade }) => {
  if (!evaluation) return null;

  // Ensure we have proper array data for strengths and improvements
  const { 
    score = 5.0, 
    strengths = [], 
    improvements = [], 
    is_premium = false, 
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
  const safeStrengths = Array.isArray(strengths) ? strengths : [strengths || 'No specific strengths identified'];
  const safeImprovements = Array.isArray(improvements) ? improvements : [improvements || 'No specific improvements suggested'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center
        ">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          {is_premium ? 'Full Report' : 'Evaluation Summary'}
        </h2>
        <p className="text-gray-400 mt-1">
          Analyzed on {formattedDate}
        </p>
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
            safeStrengths.map((strength, index) => {
              // Skip empty strings or invalid entries
              if (!strength || typeof strength !== 'string') return null;
              return (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                  </div>
                  <p className="ml-3 text-gray-300">{strength.trim()}</p>
                </div>
              );
            })
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
            safeImprovements.map((improvement, index) => {
              // Skip empty strings or invalid entries
              if (!improvement || typeof improvement !== 'string') return null;
              return (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-orange-400" />
                    </div>
                  </div>
                  <p className="ml-3 text-gray-300">{improvement.trim()}</p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400">No specific improvements suggested for the code.</p>
          )}
        </div>
      </div>

      {/* Premium Features */}
      {!is_premium && (
        <motion.div 
          className="mt-6 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-800/50 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">Unlock Full Report</h3>
              </div>
              <p className="mt-1 text-blue-200">Get the complete analysis with detailed explanations and improvement suggestions.</p>
              
              <ul className="mt-3 space-y-2">
                <li className="flex items-center text-sm text-blue-100">
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                  Detailed code analysis
                </li>
                <li className="flex items-center text-sm text-blue-100">
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                  Step-by-step improvement guide
                </li>
                <li className="flex items-center text-sm text-blue-100">
                  <Check className="w-4 h-4 text-green-400 mr-2" />
                  Priority support
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-right mt-4 md:mt-0">
              <div className="flex items-baseline justify-center md:justify-end">
                <span className="text-3xl font-bold text-white">$4.99</span>
                <span className="ml-1 text-blue-300">one-time</span>
              </div>
              <button
                onClick={() => onUpgrade(evaluation.id)}
                className="mt-3 w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <CodeIcon className="w-5 h-5 mr-2" />
                Upgrade to Pro Report
              </button>
              <p className="mt-2 text-xs text-blue-300">7-day money back guarantee</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Report Content (only visible for premium) */}
      {is_premium && (
        <div className="space-y-6">
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
        </div>
      )}
    </div>
  );
};

export default EvaluationResult;
