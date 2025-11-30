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
      // Try to get the profile with retry logic
      const maxRetries = 3;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < maxRetries) {
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
          
          // If we get here, the profile doesn't exist yet
          // Wait a bit for the trigger to create it
          await new Promise(resolve => setTimeout(resolve, 500));
          retryCount++;
          
        } catch (error) {
          lastError = error;
          // If it's a 406 error (not found), the profile might not exist yet
          if (error.code === 'PGRST116') {
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
          } else {
            throw error;
          }
        }
      }
      
      // If we've exhausted retries and still no profile, create one manually
      console.log('Profile not found after retries, creating manually');
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
      setError(error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let subscription;
    
    const getInitialSession = async () => {
      try {
        // Get initial session without setting loading to true
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Don't block UI while fetching profile
            fetchUserProfile(session.user.id).catch(error => {
              console.error('Error in initial profile fetch:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Start with loading true only if we don't have a session in local storage
    const hasSession = localStorage.getItem('supabase.auth.token');
    setLoading(!hasSession);
    
    getInitialSession();

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        try {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('User authenticated, fetching profile...');
            try {
              await fetchUserProfile(session.user.id);
            } catch (profileError) {
              console.error('Error in profile fetch:', profileError);
            }
          } else {
            console.log('No user session');
            setProfile(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setError(error.message);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );
    
    subscription = data?.subscription;

    return () => {
      isMounted = false;
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