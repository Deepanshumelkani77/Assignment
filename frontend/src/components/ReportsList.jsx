import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAppContext();

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('evaluations')
        .select(`
          *,
          task:task_id (title, created_at)
        `)
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

  const handleViewReport = (report) => {
    // In a real app, this would navigate to a detailed report view
    console.log('View report:', report);
    alert('Report details would be shown here in a full implementation');
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
            className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-colors"
          >
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">
                    {report.task?.title || 'Untitled Evaluation'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Evaluated on {formatDate(report.created_at)}
                  </p>
                </div>
                
                <div className="mt-3 md:mt-0 md:ml-4 flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      report.score >= 8 ? 'text-green-400' : 
                      report.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {report.score}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                  
                  <button
                    onClick={() => handleViewReport(report)}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {report.strengths.slice(0, 2).map((strength, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-0.5">✓</span>
                          <span className="text-sm text-gray-300">{strength}</span>
                        </li>
                      ))}
                      {report.strengths.length > 2 && (
                        <li className="text-xs text-gray-500">+{report.strengths.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400 mb-2">Improvements</h4>
                    <ul className="space-y-1">
                      {report.improvements.slice(0, 2).map((improvement, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-500 mr-2 mt-0.5">🔧</span>
                          <span className="text-sm text-gray-300">{improvement}</span>
                        </li>
                      ))}
                      {report.improvements.length > 2 && (
                        <li className="text-xs text-gray-500">+{report.improvements.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {!report.is_premium && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-400">Full Report Available</h4>
                      <p className="text-xs text-gray-400">Upgrade to view the complete analysis</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors">
                      Upgrade Now
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
