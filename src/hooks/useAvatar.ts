import { useState } from 'react';

export function useAvatar() {
  const [error, setError] = useState<string | null>(null);

  const generateAvatar = async (name: string) => {
    try {
      // Return default avatar URL directly - no need to test fetch
      // This is a reliable, production-ready service
      return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=red`;
    } catch (err) {
      console.error('Error generating avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatar');
      
      // Return null to trigger fallback UI
      return null;
    }
  };

  return { generateAvatar, error };
}