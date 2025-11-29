import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, language, userId } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Call OpenAI API to evaluate the code
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert code reviewer. Analyze the following ${language} code and provide a detailed evaluation.`
        },
        {
          role: 'user',
          content: `Please evaluate this ${language} code:\n\n${code}\n\nProvide a score out of 10, list strengths, suggest improvements, and write a detailed analysis.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const evaluationText = response.choices[0]?.message?.content || '';
    
    // Parse the evaluation to extract score, strengths, and improvements
    const scoreMatch = evaluationText.match(/score[\s:]*([\d.]+)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
    
    const strengthsMatch = evaluationText.match(/strengths?:([\s\S]*?)(?=improvements|weaknesses|analysis|$)/i);
    const strengths = strengthsMatch 
      ? strengthsMatch[1].split('\n')
          .map(s => s.replace(/^[-•*]\s*/, '').trim())
          .filter(s => s.length > 0)
      : [];

    const improvementsMatch = evaluationText.match(/(improvements|suggestions|areas for improvement):([\s\S]*?)(?=analysis|$)/i);
    const improvements = improvementsMatch
      ? improvementsMatch[2].split('\n')
          .map(s => s.replace(/^[-•*]\s*/, '').trim())
          .filter(s => s.length > 0)
      : [];

    // Save the evaluation to the database
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          title: 'Code Evaluation',
          code: code,
        },
      ])
      .select()
      .single();

    if (taskError) throw taskError;

    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert([
        {
          task_id: task.id,
          score: score || 0,
          strengths: strengths,
          improvements: improvements,
          full_report: evaluationText,
          is_premium: false,
        },
      ])
      .select()
      .single();

    if (evalError) throw evalError;

    // Return the evaluation result
    return res.status(200).json({
      success: true,
      data: {
        id: evaluation.id,
        score: evaluation.score,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        is_premium: evaluation.is_premium,
        preview: evaluation.full_report.substring(0, 200) + '...',
      },
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during evaluation',
    });
  }
}
