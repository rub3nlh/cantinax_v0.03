import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAvatar } from '../hooks/useAvatar';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = memo(({ 
  name, 
  size = 40,
  className = ''
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { generateAvatar } = useAvatar();

  // Handle image load error
  const handleImageError = useCallback(() => {
    setError(true);
    setAvatarUrl(null);
  }, []);

  useEffect(() => {
    // Skip if no name is provided
    if (!name) {
      setIsLoading(false);
      setError(true);
      return;
    }

    let isMounted = true;
    
    const loadAvatar = async () => {
      // Reset states when name changes
      if (isMounted) {
        setIsLoading(true);
        setError(false);
      }
      
      try {
        const displayName = name.trim() || 'User';
        const url = await generateAvatar(displayName);
        
        if (isMounted) {
          if (url) {
            setAvatarUrl(url);
            setError(false);
          } else {
            setError(true);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading avatar:', err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    // Debounce the avatar loading to prevent rapid consecutive calls
    const timeoutId = setTimeout(() => {
      loadAvatar();
    }, 50);
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [name, generateAvatar]);

  // Show fallback UI during loading or on error
  if (isLoading || !avatarUrl || error) {
    return (
      <div 
        className={`bg-gray-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label={`${name || 'User'}'s avatar placeholder`}
      >
        <User className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={`${name || 'User'}'s avatar`}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={handleImageError}
      loading="lazy"
    />
  );
});
