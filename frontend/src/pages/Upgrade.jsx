import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Loader2, Check, Zap } from 'lucide-react';

const Upgrade = () => {
  const { user, profile, updatePremiumStatus } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUpgrade = (planId) => {
    if (!user) {
      navigate('/login', { state: { from: '/upgrade' } });
      return;
    }

    // Redirect to Node.js server's payment page with plan ID
    window.location.href = `http://localhost:3001/payment?plan=${planId}`;
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
            <div className="text-4xl font-bold mb-6">₹0<span className="text-lg text-gray-400">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Basic feature 1
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Basic feature 2
              </li>
              <li className="flex items-center text-gray-500">
                <Zap className="h-5 w-5 text-gray-500 mr-2" />
                Premium feature 1
              </li>
              <li className="flex items-center text-gray-500">
                <Zap className="h-5 w-5 text-gray-500 mr-2" />
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
            <div className="text-4xl font-bold mb-6">₹299<span className="text-lg text-gray-400">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                All Basic Features
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Premium feature 1
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Premium feature 2
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Priority Support
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Ad-free Experience
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade('premium')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
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
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">What payment methods do you accept?</h3>
              <p className="text-gray-300">We accept all major credit/debit cards, UPI, net banking, and popular wallets like Paytm, PhonePe, and Google Pay via Razorpay's secure payment gateway.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Is my payment information secure?</h3>
              <p className="text-gray-300">Yes, we use Razorpay, a PCI DSS Level 1 certified payment processor. Your payment details are never stored on our servers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">How do I cancel my subscription?</h3>
              <p className="text-gray-300">You can cancel anytime from your account settings. Your premium features will remain active until the end of your current billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">What's your refund policy?</h3>
              <p className="text-gray-300">We offer a 7-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Need more help?</h3>
              <p className="text-gray-300">Contact our support team at <a href="mailto:support@yourdomain.com" className="text-blue-400 hover:underline">support@yourdomain.com</a> for any questions about your subscription.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
