import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

interface SignUpData {
  name: string;
  phone: string;
  address?: string;
  countryIso?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setInitialized(true);
          setLoading(false);
          console.log('🔐 Auth initialized:', initialSession ? 'Session exists' : 'No session');
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state change:', event);
      
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, data?: SignUpData) => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: data?.name,
            phone: data?.phone,
            address: data?.address,
            country_iso: data?.countryIso,
            created_at: new Date().toISOString(),
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          throw new Error('Este correo ya está registrado');
        }
        if (signUpError.message.includes('Auth session missing')) {
          throw new Error('Su email no ha sido confirmado');
        }
        throw signUpError;
      }

      if (signUpData.user && !signUpData.user.confirmed_at) {
        return { user: signUpData.user, needsEmailVerification: true };
      }

      return { user: signUpData.user, needsEmailVerification: false };
    } catch (error) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Su email no ha sido confirmado');
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales incorrectas');
        }
        throw error;
      }

      // Set user data in Crisp
      if (window.$crisp && data.user) {
        window.$crisp.push(['set', 'user:email', data.user.email]);
        window.$crisp.push(['set', 'user:nickname', data.user.user_metadata?.display_name || '']);
        window.$crisp.push(['set', 'user:phone', data.user.user_metadata?.phone || '']);
      }

      return data;
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Check if we have a session first
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        throw new Error('Error checking authentication status');
      }

      if (!currentSession) {
        console.log('No active session to sign out from');
        return;
      }

      // Clear local storage first as fallback
      localStorage.removeItem('supabase.auth.token');

      const { error } = await supabase.auth.signOut();
      if (error) {
        if (error.message.includes('Forbidden')) {
          throw new Error('Logout request was blocked. Please try again or clear browser data.');
        }
        if (error.message.includes('Network')) {
          throw new Error('Network error during logout. Please check your connection.');
        }
        throw error;
      }
      
      // Reset user data in Crisp
      if (window.$crisp) {
        window.$crisp.push(['do', 'session:reset']);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Ensure we clear local storage on error
      localStorage.removeItem('supabase.auth.token');
      
      if (error instanceof Error) {
        throw new Error(`Logout failed: ${error.message}`);
      }
      throw new Error('Unknown error during logout');
    }
  };

  return {
    user,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
  };
}
