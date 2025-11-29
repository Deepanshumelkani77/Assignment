import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);

// Helper function to verify the webhook signature
const verifyWebhook = async (req) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    throw new Error('No signature found in request headers');
  }

  try {
    return stripe.webhooks.constructEvent(
      req.body,
      signature,
      import.meta.env.VITE_STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    throw new Error('Invalid signature');
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;

  try {
    event = await verifyWebhook(req);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      
      // Update the evaluation to premium
      if (paymentIntent.metadata.evaluation_id) {
        try {
          await supabase
            .from('evaluations')
            .update({ 
              is_premium: true,
              payment_intent_id: paymentIntent.id,
              upgraded_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.metadata.evaluation_id);
        } catch (error) {
          console.error('Error updating evaluation after payment:', error);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log('PaymentIntent failed!', failedPaymentIntent.id);
      // Handle failed payment
      break;

    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // Handle successful checkout session
      break;

    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
