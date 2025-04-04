import React, { useEffect, useState } from 'react';
import { useAvatar } from '../hooks/useAvatar';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  size = 40,
  className = ''
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { generateAvatar } = useAvatar();

  useEffect(() => {
    let isMounted = true;
    
    const loadAvatar = async () => {
      if (!name) return;
      
      setIsLoading(true);
      try {
        const displayName = name.split(' ')[0] || 'User';
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

    loadAvatar();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [name, generateAvatar]);

  // Show fallback UI during loading or on error
  if (isLoading || !avatarUrl || error) {
    return (
      <div 
        className={`bg-gray-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
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
      onError={() => setError(true)}
    />
  );
};
