import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ProfileData {
  name: string;
  phone: string;
  address: string;
}

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (user: User, data: ProfileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: data.name,
          phone: data.phone,
          address: data.address
        }
      });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getProfileData = (user: User): ProfileData => {
    return {
      name: user.user_metadata?.display_name || '',
      phone: user.user_metadata?.phone || '',
      address: user.user_metadata?.address || ''
    };
  };

  return {
    loading,
    error,
    updateProfile,
    getProfileData
  };
}
