import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId } = req.query;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify the evaluation belongs to the user and update it to premium
    const { data: evaluation, error: updateError } = await supabase
      .from('evaluations')
      .update({ 
        is_premium: true,
        upgraded_at: new Date().toISOString()
      })
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error upgrading evaluation:', updateError);
      throw updateError;
    }

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: evaluation.id,
        is_premium: evaluation.is_premium,
        upgraded_at: evaluation.upgraded_at,
      },
    });
  } catch (error) {
    console.error('Error upgrading evaluation:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
