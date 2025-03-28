import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface SignUpData {
  name: string;
  phone: string;
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

      return data;
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
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