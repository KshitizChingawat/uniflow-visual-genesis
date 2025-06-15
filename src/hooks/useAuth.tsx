
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          toast.success('Welcome back!');
          navigate('/');
        }
        
        if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully');
          navigate('/');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          toast.error('User not found. Redirecting to sign up...');
          setTimeout(() => navigate('/register'), 2000);
          return { error, shouldRedirect: true };
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
          return { error };
        } else {
          toast.error(error.message);
          return { error };
        }
      }
      
      // Handle remember me functionality
      if (rememberMe && data.session) {
        localStorage.setItem('supabase-remember-me', 'true');
      } else {
        localStorage.removeItem('supabase-remember-me');
      }
      
      return { error: null };
    } catch (err) {
      toast.error('An unexpected error occurred');
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      if (data.user && !data.session) {
        toast.success('Account created! Please check your email to verify your account before signing in.');
      } else if (data.session) {
        toast.success('Account created and signed in successfully!');
        navigate('/');
      }
      
      return { error: null };
    } catch (err) {
      toast.error('An unexpected error occurred during registration');
      return { error: err };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('supabase-remember-me');
    if (error) {
      toast.error(error.message);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
