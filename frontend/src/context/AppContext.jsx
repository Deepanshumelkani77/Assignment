import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = useCallback(async (userId) => {
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
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);
  
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
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    } finally {
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
    session,
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