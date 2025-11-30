import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setProfile(data);
        return data;
      }
      
      // If profile doesn't exist, create a default one
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: userId, is_premium: false })
        .select()
        .single();
        
      if (createError) throw createError;
      
      setProfile(newProfile);
      return newProfile;
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          fetchUserProfile(session.user.id).catch(console.error);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const updatePremiumStatus = async (userId, isPremium) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_premium: isPremium })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      setProfile(prev => ({
        ...prev,
        is_premium: isPremium
      }));
      
      return data;
    } catch (error) {
      console.error('Error updating premium status:', error);
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (signUpError) throw signUpError;
      
      // The profile will be created by the trigger we set up
      return { success: true, data };
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
      return { success: false, error };
      setLoading(false);
    }
  };


  // Function to evaluate code using AI
  const evaluateCode = async (code, language) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call your backend API
      // which would then call the AI service (OpenAI, etc.)
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          code,
          language,
          userId: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to evaluate code');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error evaluating code:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updatePremiumStatus,
    refreshProfile: () => user ? fetchUserProfile(user.id) : Promise.resolve(null)
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};