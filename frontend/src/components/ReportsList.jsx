import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, profile } = useAppContext();
  const isUserPremium = profile?.is_premium || false;

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
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
          My Reports
        </h2>
        <p className="text-gray-400">View your past code evaluations and improvements</p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-colors p-6"
          >
            <div className="flex flex-col space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {report.title || 'Untitled Evaluation'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Evaluated on {formatDate(report.created_at)}
                </p>
                <div className="mt-2 text-3xl font-bold text-white">
                  {report.score?.toFixed(1) || 'N/A'}
                  <span className="text-sm text-gray-400 ml-1">/10</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-2">Strengths</h4>
                <ul className="space-y-2">
                  {report.strengths?.slice(0, 3).map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5"></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-300">
                        {strength}
                      </span>
                    </li>
                  ))}
                  {!isUserPremium && report.strengths?.length > 3 && (
                    <li className="text-xs text-blue-400 mt-2">
                      +{report.strengths.length - 3} more strengths available with premium
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <h4 className="text-sm font-medium text-orange-400 mb-2">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {report.improvements?.slice(0, 3).map((improvement, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5"></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-300">
                        {improvement}
                      </span>
                    </li>
                  ))}
                  {!isUserPremium && report.improvements?.length > 3 && (
                    <li className="text-xs text-blue-400 mt-2">
                      +{report.improvements.length - 3} more improvements available with premium
                    </li>
                  )}
                </ul>
              </div>

              {!isUserPremium && (
                <div className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/30 mb-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">Unlock More with Premium</h3>
                  <p className="text-sm text-gray-300 mb-4">Get full access to all features and unlimited reports</p>
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upgrade to Premium
                  </button>
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
