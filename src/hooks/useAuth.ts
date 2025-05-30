import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { migrateGuestAddresses } from './useAddresses';

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

  /**
   * Add a user to the Brevo marketing list
   * This function handles adding a user to the Brevo list and manages the localStorage flag
   * to prevent duplicate additions
   */
  const addUserToBrevoList = async (user: User, context: string = 'general') => {
    if (!user.email_confirmed_at) {
      console.log('User email not verified, skipping Brevo list addition');
      return;
    }

    // Check if we've already added this user to the Brevo list
    const brevoListKey = `brevo_list_added_${user.id}`;
    const alreadyAdded = localStorage.getItem(brevoListKey);
    
    if (alreadyAdded) {
      console.log(`${context} user already added to Brevo list, skipping`);
      return;
    }
    
    try {
      console.log(`Attempting to add ${context} user to Brevo list:`, user.email);
      const response = await fetch('/api/users/add-to-brevo-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: user.user_metadata?.display_name || '',
          phone: user.user_metadata?.phone || ''
        })
      });
      
      if (response.ok) {
        // Mark this user as added to prevent duplicate calls
        localStorage.setItem(brevoListKey, 'true');
        console.log(`${context} user added to Brevo list successfully`);
      } else {
        console.error(`Failed to add ${context} user to Brevo list:`, await response.text());
      }
    } catch (brevoError) {
      // Log error but don't disrupt the user experience
      console.error(`Error adding ${context} user to Brevo list:`, brevoError);
    }
  };

  /**
   * Set user data in Crisp chat widget
   */
  const setCrispUserData = (user: User) => {
    if (window.$crisp) {
      window.$crisp.push(['set', 'user:email', user.email]);
      window.$crisp.push(['set', 'user:nickname', user.user_metadata?.display_name || '']);
      window.$crisp.push(['set', 'user:phone', user.user_metadata?.phone || '']);
    }
  };

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
          
          // If we have a verified user in the initial session, add them to Brevo list
          if (initialSession?.user) {
            await addUserToBrevoList(initialSession.user, 'initial session');
          }
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
        
        // Set user data in Crisp when user is verified or signs in
        if (newSession?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          setCrispUserData(newSession.user);
          
          // Add user to Brevo list if email is verified
          // This happens in two cases:
          // 1. When a user verifies their email (USER_UPDATED event)
          // 2. When a user signs in with a verified email (SIGNED_IN event)
          if ((event === 'USER_UPDATED' && newSession.user.email_confirmed_at) || 
              (event === 'SIGNED_IN' && newSession.user.email_confirmed_at)) {
            await addUserToBrevoList(newSession.user, 'auth state change');
          }
        }
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

      // If user doesn't need email verification, migrate guest addresses
      if (signUpData.user) {
        await migrateGuestAddresses(signUpData.user.id);
        
        // Set user data in Crisp
        setCrispUserData(signUpData.user);
        
        // If the user is already verified (rare case), add them to Brevo list
        await addUserToBrevoList(signUpData.user, 'sign up');
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
      if (data.user) {
        setCrispUserData(data.user);

        // Migrate guest addresses to Supabase after successful login
        await migrateGuestAddresses(data.user.id);
        
        // If the user has a verified email, add them to Brevo list
        await addUserToBrevoList(data.user, 'sign in');
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
