import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Stripe with the webhook secret
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

async function handleCheckoutSessionCompleted(session) {
  const userId = session.client_reference_id;
  
  if (!userId) {
    console.error('No user ID in session');
    return;
  }

  // Update the user's premium status
  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user premium status:', error);
    throw error;
  }

  console.log(`Updated user ${userId} to premium`);
}

async function handleSubscriptionChange(subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  // Check if the subscription is active
  const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

  // Update the user's premium status
  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user premium status:', error);
    throw error;
  }

  console.log(`Updated user ${userId} premium status to: ${isPremium}`);
}
