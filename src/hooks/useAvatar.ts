import { useState } from 'react';

// Simple in-memory cache outside the component
const avatarCache: Record<string, string> = {};

export function useAvatar() {
  const [error, setError] = useState<string | null>(null);

  const generateAvatar = async (name: string) => {
    try {
      // Normalize the name to ensure consistent caching
      const normalizedName = name.trim().toLowerCase();
      
      // Return cached URL if available
      if (avatarCache[normalizedName]) {
        return avatarCache[normalizedName];
      }
      
      // Generate new avatar URL
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedName)}&backgroundColor=red`;
      
      // Cache the URL
      avatarCache[normalizedName] = avatarUrl;
      
      return avatarUrl;
    } catch (err) {
      console.error('Error generating avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatar');
      
      // Return null to trigger fallback UI
      return null;
    }
  };

  return { generateAvatar, error };
}
