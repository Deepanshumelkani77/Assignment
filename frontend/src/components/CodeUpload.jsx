import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Code as CodeIcon, X, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAppContext } from '../context/AppContext';
import EvaluationResult from './EvaluationResult';
import { supabase } from '../lib/supabase';

// Initialize Google's Generative AI with the latest API version
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const CodeUpload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAppContext();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setCode(''); // Clear code input if file is selected
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setFile(droppedFile);
      setCode(''); // Clear code input if file is dropped
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const evaluateCode = async (codeContent) => {
    // In a real app, you would call your backend API here
    // This is a mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const score = Math.random() * 10;
        resolve({
          score: score.toFixed(1),
          strengths: [
            'Good code structure',
            'Readable variable names',
            'Efficient algorithm',
          ].slice(0, 1 + Math.floor(Math.random() * 3)),
          improvements: [
            'Add error handling',
            'Improve time complexity',
            'Add comments',
            'Consider edge cases',
          ].slice(0, 1 + Math.floor(Math.random() * 3)),
          full_report: `# Code Evaluation Report\n\n## Score: ${score.toFixed(1)}/10\n\n### Strengths\n- Good code structure\n- Readable variable names\n- Efficient algorithm\n\n### Areas for Improvement\n- Add error handling\n- Improve time complexity\n- Add comments\n- Consider edge cases\n\n### Detailed Analysis\nThis is a detailed analysis of your code. In a real implementation, this would contain AI-generated insights about your code's quality, performance, and best practices.`,
        });
      }, 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!code && !file) || !title.trim()) {
      setError('Please provide a title and either paste code or upload a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setEvaluation(null);

    try {
      let codeContent = code;
      let filePath = null;

      // If file is uploaded, read its content
      if (file) {
        codeContent = await readFileContent(file);
        
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('code-submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        filePath = fileName;
      }

      // Create task in database
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title,
            description: description || null,
            code: codeContent,
            file_path: filePath,
          },
        ])
        .select()
        .single();

      if (taskError) throw taskError;

      // Evaluate code using Gemini 2.5 Flash Preview
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-preview-09-2025',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
      const prompt = `You are an expert code reviewer. Please evaluate the following code for quality, best practices, and potential improvements:

${codeContent}

Provide a detailed evaluation including:
1. A score from 1-10
2. Key strengths of the code
3. Areas for improvement
4. Specific suggestions for better practices

Format your response with clear sections for each part.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const evaluationText = response.text();

      // Parse the evaluation
      console.log('AI Response:', evaluationText);
      
      // Extract score - look for patterns like "6/10" or "Score: 6" or "6 out of 10"
      let score = 5.0; // Default score
      
      // First try to find score in markdown format like "**6/10**"
      const markdownScoreMatch = evaluationText.match(/\*\*(\d+(?:\.\d+)?)\s*\/\s*10\*\*/i);
      if (markdownScoreMatch) {
        const scoreValue = parseFloat(markdownScoreMatch[1]);
        if (!isNaN(scoreValue)) {
          score = Math.max(1, Math.min(10, scoreValue));
        }
      } else {
        // Fallback to more general pattern matching
        const scoreMatch = evaluationText.match(/(?:score|rating)[:\s]*(\d+(?:\.\d+)?)(?:\s*\/\s*10)?/i) || 
                          evaluationText.match(/(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*10/i);
        
        if (scoreMatch) {
          const scoreValue = parseFloat(scoreMatch[1]);
          if (!isNaN(scoreValue)) {
            score = Math.max(1, Math.min(10, scoreValue));
          }
        }
      }
      
      console.log('Parsed score:', score);

      // Extract strengths and improvements with more robust parsing
      const strengths = [];
      const improvements = [];
      
      // Try to find strengths section - looking for markdown headers or numbered sections
      const strengthSections = evaluationText.split(/##?\s*\d*\.?\s*(?:strengths?|pros?):?/i);
      if (strengthSections.length > 1) {
        const strengthContent = strengthSections[1].split(/##?\s*\d*\.?\s*(?:improvements?|areas? for improvement|cons?):?/i)[0];
        const strengthItems = strengthContent
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0 && !item.match(/^\s*[-=*_]{3,}\s*$/));
        
        if (strengthItems.length > 0) {
          strengths.push(...strengthItems);
        }
      }

      // Try to find improvements section - looking for markdown headers or numbered sections
      const improvementSections = evaluationText.split(/##?\s*\d*\.?\s*(?:improvements?|areas? for improvement|cons?):?/i);
      if (improvementSections.length > 1) {
        const improvementContent = improvementSections[1].split(/##?\s*\d*\.?\s*(?:suggestions?|recommendations?|conclusion):?/i)[0];
        const improvementItems = improvementContent
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0 && !item.match(/^\s*[-=*_]{3,}\s*$/));
        
        if (improvementItems.length > 0) {
          improvements.push(...improvementItems);
        }
      }

      // Fallback if no strengths/improvements found in structured format
      if (strengths.length === 0) {
        // Try to extract any bullet points that might indicate strengths
        const potentialStrengths = evaluationText.match(/[-•*]\s*([^\n]+)(?=\n[-•*]|$)/gi);
        if (potentialStrengths && potentialStrengths.length > 0) {
          strengths.push(...potentialStrengths.map(s => s.replace(/^[-•*]\s*/, '').trim()));
        } else {
          strengths.push('No specific strengths identified in the code');
        }
      }
      
      if (improvements.length === 0) {
        // Look for common improvement indicators if no structured section found
        const potentialImprovements = evaluationText.match(/(?:improve|consider|recommend|suggest|better|should|avoid)[^.!?]*[.!?]/gi);
        if (potentialImprovements && potentialImprovements.length > 0) {
          improvements.push(...potentialImprovements.map(i => i.trim()));
        } else {
          improvements.push('No specific improvements suggested for the code');
        }
      }

      console.log('Strengths:', strengths);
      console.log('Improvements:', improvements);

      // Save evaluation to database
      const { data: evaluationData, error: evalError } = await supabase
        .from('evaluations')
        .insert([
          {
            task_id: task.id,
            code: codeContent,
            title: title || 'Untitled',
            description: description || '',
            score: score,
            timestamp: new Date().toISOString(),
            strengths: strengths.length ? strengths : ['No specific strengths identified'],
            improvements: improvements.length ? improvements : ['No specific improvements suggested'],
            full_evaluation: evaluationText,
            is_premium: true,
            model_used: 'gemini-pro',
            user_id: user.id
          },
        ])
        .select()
        .single();

      if (evalError) throw evalError;

      setEvaluation({
        ...evaluationData,
        score,
        strengths,
        improvements,
        full_evaluation: evaluationText,
        task_title: title,
      });
    } catch (error) {
      console.error('Error submitting code:', error);
      setError(error.message || 'An error occurred while processing your request');
    } finally {
      setIsLoading(false);
    }
  };


  if (evaluation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Evaluation Results
          </h2>
          <button
            onClick={() => {
              setEvaluation(null);
              setCode('');
              setFile(null);
              setTitle('');
              setDescription('');
            }}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <EvaluationResult evaluation={evaluation} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Submit Your Code
        </h2>
        <p className="text-gray-400">Get AI-powered code evaluation and improvement suggestions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
            placeholder="e.g., Sorting Algorithm Implementation"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
            placeholder="Briefly describe what your code does..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-300">Upload File</label>
              <span className="text-xs text-gray-500">Max 5MB</span>
            </div>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.rs"
              />
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">
                  {file ? file.name : 'Drag & drop a file or click to browse'}
                </p>
                <p className="text-xs text-gray-500">
                  Supported: .js, .py, .java, .c, .cpp, etc.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-300">Or Paste Code</label>
              <span className="text-xs text-gray-500">
                {code.length}/5000 chars
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => {
                if (e.target.value.length <= 5000) {
                  setCode(e.target.value);
                  if (file) {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }
                }
              }}
              rows="10"
              className="w-full px-4 py-3 font-mono text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
              placeholder="Paste your code here..."
              disabled={!!file}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || (!code && !file) || !title.trim()}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
              isLoading || (!code && !file) || !title.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </div>
            ) : (
              'Evaluate Code'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CodeUpload;
