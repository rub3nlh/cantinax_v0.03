import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface AdminState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export function useAdmin() {
  const { user, session, initialized: authInitialized } = useAuth();
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    loading: true,
    error: null,
    initialized: false
  });

  useEffect(() => {
    let mounted = true;
    let subscription: any;
    
    const checkAdminStatus = async () => {
      try {
        // Wait for auth to be initialized
        if (!authInitialized) {
          console.log('⏳ Waiting for auth initialization...');
          return;
        }

        // If no session or user, they can't be admin
        if (!session || !user) {
          if (mounted) {
            setState(prev => ({
              ...prev,
              isAdmin: false,
              loading: false,
              initialized: true
            }));
          }
          return;
        }

        console.log('👤 Checking staff status for user:', user.id);

        // Query staff_members table for this user
        const { data, error: queryError } = await supabase
          .from('staff_members')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        // Only update state if component is still mounted
        if (!mounted) return;

        if (queryError) {
          console.error('❌ Error querying staff_members:', queryError.message);
          setState(prev => ({
            ...prev,
            error: queryError.message,
            isAdmin: false,
            loading: false,
            initialized: true
          }));
          return;
        }

        // Check if user has admin role
        const hasAdminRole = data?.role === 'admin';
        
        console.log('📊 Staff query result:', {
          found: !!data,
          role: data?.role || 'none',
          isAdmin: hasAdminRole
        });

        setState(prev => ({
          ...prev,
          isAdmin: hasAdminRole,
          loading: false,
          error: null,
          initialized: true
        }));

      } catch (err) {
        if (!mounted) return;
        
        console.error('❌ Error in admin status check:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          isAdmin: false,
          loading: false,
          initialized: true
        }));
      }
    };

    // Set up real-time subscription for staff_members changes
    const setupSubscription = () => {
      if (!user?.id) return;

      subscription = supabase
        .channel('staff-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'staff_members',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('🔄 Staff member status changed, rechecking...');
          checkAdminStatus();
        })
        .subscribe();
    };

    // Run initial check and setup subscription
    checkAdminStatus();
    setupSubscription();

    // Cleanup function
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, session, authInitialized]); // Re-run when auth state changes

  return state;
}
