import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '../lib/stripe';
import Payment from './Payment';

const PaymentModal = ({ isOpen, onClose, evaluationId, onSuccess }) => {
  const [stripePromise] = useState(() => getStripe());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            className="relative w-full max-w-md bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-1">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-1 rounded-full" />
            </div>

            <div className="p-6">
              <Elements stripe={stripePromise}>
                <Payment 
                  evaluationId={evaluationId} 
                  onSuccess={() => {
                    onSuccess();
                    onClose();
                  }} 
                  onCancel={onClose}
                />
              </Elements>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
