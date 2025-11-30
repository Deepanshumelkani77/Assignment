import { supabase } from '../lib/supabaseClient';

export const callSupabaseFunction = async (functionName, data = {}) => {
  try {
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: data
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error(`API Error in ${functionName}:`, error);
    throw error;
  }
};

export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = error?.message || defaultMessage;
  console.error('API Error:', error);
  return { error: true, message };
};
