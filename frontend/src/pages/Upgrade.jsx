import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Loader2, Check, Zap, Star } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

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

const Upgrade = () => {
  const { user, profile, updatePremiumStatus } = useAppContext();
  const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // Check for success state on initial load (for page refreshes)
  useEffect(() => {
    const success = localStorage.getItem('upgradeSuccess');
    if (success && profile?.is_premium) {
      setShowSuccess(true);
      localStorage.removeItem('upgradeSuccess');
    }
  }, [profile?.is_premium]);

  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    setShowSuccess(false);
    navigate('/dashboard');
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/upgrade' } });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
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
            setLoading(true);
            // First, update the profile in the database
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', user.id);

            if (updateError) throw updateError;
            
            // Then refresh the profile data
            const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            
            // Update the profile in context and show success message
            await updatePremiumStatus(true);
            setShowSuccess(true);
            
            // Clean up any existing success state
            localStorage.removeItem('upgradeSuccess');
          } catch (error) {
            console.error('Error updating premium status:', error);
            alert('Payment was successful but there was an error updating your account. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description || 'Please try again'}`);
        setLoading(false);
      });
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  };

  if (profile?.is_premium || showSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">You're Already a Premium Member!</h1>
          <p className="text-xl mb-8">Thank you for supporting us. Enjoy all premium features.</p>
          <button
            onClick={handleGoToDashboard}
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
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Upgrade to Premium (₹299)
                </span>
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
