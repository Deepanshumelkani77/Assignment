import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import getStripe from '../lib/stripe';

const Upgrade = () => {
  const { user, profile, updatePremiumStatus } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUpgrade = async (planId) => {
    if (!user) {
      navigate('/login', { state: { from: '/upgrade' } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call your backend to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ planId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
      }

      const { sessionId } = await response.json();
      const stripe = await getStripe();
      
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.is_premium) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">You're Already a Premium Member!</h1>
          <p className="text-xl mb-8">Thank you for supporting us. Enjoy all premium features.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Upgrade to Premium</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-gray-400 mb-4">Basic features to get you started</p>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic feature 1
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic feature 2
              </li>
              <li className="flex items-center text-gray-500">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Premium feature 1
              </li>
              <li className="flex items-center text-gray-500">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Premium feature 2
              </li>
            </ul>
            <button
              disabled
              className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg opacity-50 cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500 transform hover:scale-105 transition-transform">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">Premium</h2>
              <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded">RECOMMENDED</span>
            </div>
            <p className="text-gray-400 mb-4">Unlock all features and support our work</p>
            <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg text-gray-400">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic feature 1
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic feature 2
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Premium feature 1
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Premium feature 2
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 Priority Support
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade('premium_monthly')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Upgrade to Premium'
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">What payment methods do you accept?</h3>
              <p className="text-gray-400">We accept all major credit cards and PayPal.</p>
            </div>
            <div>
              <h3 className="font-semibold">Can I cancel anytime?</h3>
              <p className="text-gray-400">Yes, you can cancel your subscription anytime. Your premium features will remain active until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold">Is there a free trial?</h3>
              <p className="text-gray-400">We currently don't offer a free trial, but we have a 30-day money-back guarantee if you're not satisfied.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
