import React from 'react';

interface DiscountTagProps {
  variant?: 'red' | 'yellow';
  className?: string;
  children: React.ReactNode;
}

export const DiscountTag: React.FC<DiscountTagProps> = ({ 
  variant = 'red', 
  className = '',
  children,
  ...props 
}) => {
  const baseClasses = 'inline-block px-4 py-2 rounded-full text-sm font-semibold';
  
  const variantClasses = {
    red: 'bg-red-100 text-red-600',
    yellow: 'text-black' // Con estilo inline para el color de fondo #fbaf25
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={variant === 'yellow' ? { backgroundColor: '#fbaf25' } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};
