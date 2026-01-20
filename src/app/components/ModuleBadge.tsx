import React from 'react';

interface ModuleBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ModuleBadge: React.FC<ModuleBadgeProps> = ({ 
  children, 
  variant = 'primary' 
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--module-primary)',
          color: '#ffffff',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(var(--module-light-rgb), 0.5)',
          color: 'var(--module-dark)',
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--module-primary)',
          border: '1px solid var(--module-shadow)',
        };
      default:
        return {};
    }
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full transition-all duration-200"
      style={getStyles()}
    >
      {children}
    </span>
  );
};