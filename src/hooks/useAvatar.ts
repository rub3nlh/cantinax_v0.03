import { useState, useCallback, useMemo } from 'react';

// Simple in-memory cache outside the component
const avatarCache: Record<string, string> = {};

// Function to generate a color based on the name
const getColorFromName = (name: string): string => {
  // Simple hash function to generate a consistent color from a name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a hex color
  const color = Math.abs(hash).toString(16).substring(0, 6);
  return color.padStart(6, '0');
};

// Function to generate SVG data URI for an avatar with initials
const generateInitialsAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const backgroundColor = getColorFromName(name);
  
  // Create SVG for the avatar
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#${backgroundColor}" />
      <text 
        x="50" 
        y="50" 
        fill="white" 
        font-family="Arial, sans-serif" 
        font-size="40" 
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${initials}
      </text>
    </svg>
  `;
  
  // Convert to a data URI
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export function useAvatar() {
  const [error, setError] = useState<string | null>(null);

  const generateAvatar = useCallback(async (name: string) => {
    try {
      if (!name) {
        return null;
      }
      
      // Normalize the name to ensure consistent caching
      const normalizedName = name.trim().toLowerCase();
      
      // Return cached URL if available
      if (avatarCache[normalizedName]) {
        return avatarCache[normalizedName];
      }
      
      // Generate avatar as data URI instead of external API call
      const avatarUrl = generateInitialsAvatar(normalizedName);
      
      // Cache the URL
      avatarCache[normalizedName] = avatarUrl;
      
      return avatarUrl;
    } catch (err) {
      console.error('Error generating avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatar');
      
      // Return null to trigger fallback UI
      return null;
    }
  }, []);

  return { generateAvatar, error };
}
