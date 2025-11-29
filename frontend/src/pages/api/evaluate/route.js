import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { code, title, description, userId } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate the prompt
    const prompt = `Evaluate the following code for quality, best practices, and potential improvements. 
    Code Title: ${title || 'Untitled'}
    Description: ${description || 'No description provided'}
    
    Code:\n\`\`\`${code}\`\`\`
    
    Please provide a detailed evaluation including:
    1. A score from 1-10
    2. Key strengths of the code
    3. Areas for improvement
    4. Specific suggestions for better practices`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const evaluationText = response.text();

    // Parse the evaluation
    const scoreMatch = evaluationText.match(/\b\d+(\.\d+)?\b/);
    const score = scoreMatch ? parseFloat(scoreMatch[0]) : 5.0;

    const strengths = [];
    const improvements = [];
    
    // Simple parsing - adjust based on Gemini's response format
    const strengthMatch = evaluationText.match(/strengths?:([\s\S]*?)(?=\n\s*\d+\.|\n\s*Areas|\n\s*Suggestions|$)/i);
    if (strengthMatch) {
      strengths.push(...strengthMatch[1].split('\n').filter(line => line.trim()));
    }

    const improvementMatch = evaluationText.match(/improvements?:([\s\S]*?)(?=\n\s*\d+\.|\n\s*Suggestions|$)/i);
    if (improvementMatch) {
      improvements.push(...improvementMatch[1].split('\n').filter(line => line.trim()));
    }

    // Save to database
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .insert([
        {
          user_id: userId,
          code,
          title: title || 'Untitled',
          description: description || '',
          score,
          strengths: strengths.length ? strengths : ['No specific strengths identified'],
          improvements: improvements.length ? improvements : ['No specific improvements suggested'],
          full_evaluation: evaluationText,
          is_premium: false,
          model_used: 'gemini-pro'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      id: evaluation.id,
      score,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      fullEvaluation: evaluation.full_evaluation,
      isPremium: evaluation.is_premium,
      createdAt: evaluation.created_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error evaluating code with Gemini:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to evaluate code',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
