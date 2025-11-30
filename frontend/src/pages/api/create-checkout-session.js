import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { planId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get the user's email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // In a real app, you would fetch the price ID from your database based on the planId
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID; // Set this in your environment

    if (!priceId) {
      throw new Error('STRIPE_PREMIUM_PRICE_ID is not set');
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=true`,
      customer_email: profile.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      message: 'Error creating checkout session',
      error: error.message 
    });
  }
}
