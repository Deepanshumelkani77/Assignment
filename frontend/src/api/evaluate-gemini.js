import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

// Initialize the Google Generative AI client with your API key
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, title, description, userId } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
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

    // Parse the evaluation (you might need to adjust this based on Gemini's response format)
    const scoreMatch = evaluationText.match(/\b\d+(\.\d+)?\b/);
    const score = scoreMatch ? parseFloat(scoreMatch[0]) : 5.0;

    const strengths = [];
    const improvements = [];
    
    // Simple parsing - you might need to adjust this based on Gemini's response format
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

    return res.status(200).json({
      id: evaluation.id,
      score,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      fullEvaluation: evaluation.full_evaluation,
      isPremium: evaluation.is_premium,
      createdAt: evaluation.created_at
    });

  } catch (error) {
    console.error('Error evaluating code with Gemini:', error);
    return res.status(500).json({ 
      error: 'Failed to evaluate code',
      details: error.message 
    });
  }
}
