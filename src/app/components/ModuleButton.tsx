import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ModuleButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'icon';
  icon?: LucideIcon;
  onClick?: () => void;
}

export const ModuleButton: React.FC<ModuleButtonProps> = ({ 
  children, 
  variant = 'primary',
  icon: Icon,
  onClick 
}) => {
  const { theme } = useTheme();

  // 根据主题获取颜色值
  const getThemeColors = () => {
    switch(theme) {
      case 'cpu':
        return { primary: '#2A6EBB', shadow: '#1E5CA3', dark: '#0D3A6A' };
      case 'memory':
        return { primary: '#27AE60', shadow: '#1E8449', dark: '#0E5C2F' };
      case 'storage':
        return { primary: '#8E44AD', shadow: '#703688', dark: '#4A235A' };
      case 'network':
        return { primary: '#E67E22', shadow: '#C15811', dark: '#8B3A0A' };
      case 'security':
        return { primary: '#E74C3C', shadow: '#C0392B', dark: '#922B21' };
      default:
        return { primary: '#2A6EBB', shadow: '#1E5CA3', dark: '#0D3A6A' };
    }
  };

  const colors = getThemeColors();

  if (variant === 'icon' && Icon) {
    return (
      <motion.button
        onClick={onClick}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          color: 'var(--module-primary)',
          backgroundColor: 'transparent',
        }}
        whileHover={{
          backgroundColor: `${colors.primary}26`, // 15% opacity in hex
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon size={20} />
      </motion.button>
    );
  }

  if (variant === 'secondary') {
    return (
      <motion.button
        onClick={onClick}
        className="px-6 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2"
        style={{
          border: '1px solid var(--module-shadow)',
          color: 'var(--module-dark)',
          backgroundColor: 'transparent',
        }}
        whileHover={{
          backgroundColor: `${colors.primary}1A`, // 10% opacity in hex
        }}
        whileTap={{ scale: 0.98 }}
      >
        {Icon && <Icon size={18} />}
        {children}
      </motion.button>
    );
  }

  // Primary variant
  return (
    <motion.button
      onClick={onClick}
      className="px-6 py-2.5 rounded-md transition-all duration-300 flex items-center gap-2"
      style={{
        border: '1px solid var(--module-shadow)',
        backgroundColor: `${colors.primary}CC`, // 80% opacity in hex
        color: '#ffffff',
      }}
      whileHover={{
        backgroundColor: colors.primary,
        borderLeft: '5px solid var(--module-shadow)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {Icon && <Icon size={18} />}
      {children}
    </motion.button>
  );
};