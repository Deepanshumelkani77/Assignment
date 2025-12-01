import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
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
      
      const amount = 299; // 299 INR
      
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
      <div className="min-h-screen bg-gradient-to-br from-black via-black/90 to-black/80 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/30 p-8 md:p-12"
          >
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-8 rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              You're Already a Premium Member! 🎉
            </h1>
            <p className="text-xl text-gray-300 mb-8">Thank you for supporting us. Enjoy all premium features.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoToDashboard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Go to Dashboard
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black/90 to-black/80 text-gray-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/5 to-transparent opacity-30"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/5 to-transparent opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Unlock all features and take your coding skills to the next level</p>
        </motion.div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-8 backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-xl"
          >
            <div className="h-1 bg-gradient-to-r from-gray-600 to-gray-600/0 mb-6 rounded-full"></div>
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-gray-400 mb-6">Basic features to get you started</p>
            <div className="text-4xl font-bold mb-6">₹0<span className="text-lg text-gray-400">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Basic code evaluation</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Limited daily evaluations</span>
              </li>
              <li className="flex items-center text-gray-500">
                <Zap className="h-5 w-5 text-gray-600 mr-3" />
                <span>Advanced AI analysis</span>
              </li>
              <li className="flex items-center text-gray-500">
                <Zap className="h-5 w-5 text-gray-600 mr-3" />
                <span>Priority support</span>
              </li>
            </ul>
            <button
              disabled
              className="w-full bg-gray-800/50 text-gray-500 font-bold py-3 px-4 rounded-xl border border-gray-700 cursor-not-allowed"
            >
              Current Plan
            </button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
              RECOMMENDED
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mb-6 rounded-full"></div>
            <h2 className="text-2xl font-bold mb-2">Premium</h2>
            <p className="text-gray-300 mb-6">Unlock all features and support our work</p>
            <div className="text-4xl font-bold mb-2">₹299<span className="text-lg text-gray-400">/month</span></div>
            <p className="text-sm text-gray-400 mb-6">Billed monthly. Cancel anytime.</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Unlimited code evaluations</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Advanced AI analysis</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Detailed code insights</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-3" />
                <span>Export reports</span>
              </li>
            </ul>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </span>
              )}
            </motion.button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16 bg-gray-900/40 backdrop-blur-sm p-8 rounded-2xl border border-white/5 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-200">What payment methods do you accept?</h3>
                <p className="text-gray-400">We accept all major credit/debit cards, UPI, net banking, and popular wallets via Razorpay's secure payment gateway.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-200">Is my payment information secure?</h3>
                <p className="text-gray-400">Yes, we use Razorpay, a PCI DSS Level 1 certified payment processor. Your payment details are never stored on our servers.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-200">How do I cancel my subscription?</h3>
                <p className="text-gray-400">You can cancel anytime from your account settings. Your premium features will remain active until the end of your billing period.</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-200">What's your refund policy?</h3>
                <p className="text-gray-400">We offer a 7-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-200">Can I change plans later?</h3>
                <p className="text-gray-400">Absolutely! You can upgrade, downgrade, or cancel your subscription at any time from your account settings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-200">Need more help?</h3>
                <p className="text-gray-400">Contact our support team at <a href="mailto:support@codeeval.com" className="text-blue-400 hover:underline">support@codeeval.com</a> for any questions.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} CodeEval AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
