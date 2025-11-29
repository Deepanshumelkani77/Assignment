import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

const Payment = ({ onSuccess, onCancel, evaluationId, price = 499 }) => {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAppContext();

  useEffect(() => {
    // Create PaymentIntent as soon as the component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
          },
          body: JSON.stringify({
            evaluationId,
            amount: price * 100, // Convert to cents
            currency: 'usd',
          }),
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
      }
    };

    createPaymentIntent();
  }, [evaluationId, price, user?.access_token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: user?.user_metadata?.full_name || 'Anonymous',
          email: user?.email,
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      setSucceeded(true);
      setError(null);
      setProcessing(false);
      
      // Update the evaluation to mark as premium
      try {
        await fetch(`/api/evaluations/${evaluationId}/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
          },
        });
        
        // Call the success callback if provided
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Error upgrading evaluation:', err);
        setError('Payment succeeded but there was an error upgrading your report.');
      }
    }
  };

  if (succeeded) {
    return (
      <motion.div 
        className="text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-gray-300 mb-6">Your payment has been processed successfully.</p>
        <button
          onClick={onSuccess}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          View Full Report
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Upgrade to Premium Report</h3>
        <p className="text-gray-300 mb-6">
          Unlock the full detailed analysis of your code for just ${(price / 100).toFixed(2)}.
        </p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="flex items-center text-red-400 text-sm">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="text-gray-300 hover:text-white font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            processing || !stripe || !clientSecret
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {processing ? 'Processing...' : `Pay $${(price / 100).toFixed(2)}`}
        </button>
      </div>
    </motion.form>
  );
};

export default Payment;
