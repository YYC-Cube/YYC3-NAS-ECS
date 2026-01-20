import React, { useState, ReactNode } from 'react';
import { motion } from 'motion/react';

interface ModuleCardProps {
  title: string;
  children: ReactNode;
  level?: 1 | 2; // 层级1: 内容卡片, 层级2: 数据卡片
  onClick?: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  children, 
  level = 1,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick?.();
    setTimeout(() => setIsClicked(false), 200);
  };

  const shadowWidth = isClicked ? '5px' : '4px';
  
  return (
    <motion.div
      className="p-6 rounded-lg transition-all duration-300 relative overflow-hidden"
      style={{
        /* 增强边框系统 */
        border: '1px solid rgba(var(--module-primary), 0.15)',
        borderLeft: `${shadowWidth} solid var(--module-shadow)`,
        backgroundColor: level === 1 
          ? 'rgba(var(--module-light-rgb), 0.14)'
          : 'linear-gradient(to bottom, rgba(var(--module-light-rgb), 0.18), rgba(var(--module-light-rgb), 0.08))',
        boxShadow: isHovered 
          ? `0 20px 50px rgba(var(--module-primary), 0.20), 0 8px 25px rgba(var(--module-primary), 0.15), 0 4px 15px rgba(var(--module-primary), 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)`
          : `0 10px 28px rgba(var(--module-primary), 0.15), 0 4px 12px rgba(var(--module-primary), 0.10), 0 2px 6px rgba(var(--module-primary), 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
        backdropFilter: 'blur(15px)',
        borderRadius: '16px',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      initial={{ opacity: 0, y: 15, boxShadow: '0 0 0 rgba(var(--module-primary), 0.0)' }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        scale: 1.025,
        boxShadow: `0 25px 65px rgba(var(--module-primary), 0.25), 0 12px 35px rgba(var(--module-primary), 0.20), 0 6px 20px rgba(var(--module-primary), 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.95)`
      }}
      whileTap={{ 
        scale: 0.985,
        boxShadow: `0 6px 20px rgba(var(--module-primary), 0.18), 0 3px 10px rgba(var(--module-primary), 0.12), inset 0 2px 6px rgba(var(--module-primary), 0.08)`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="p-5">
        <h3 
          className="mb-4"
          style={{ 
            color: 'var(--module-primary)',
            fontWeight: 600,
            fontSize: '1.15rem',
            transition: 'all 0.3s ease'
          }}
        >
          {title}
        </h3>
        <div style={{ color: 'var(--module-dark)' }}>
          {children}
        </div>
      </div>

      {/* 增强点击反馈效果 */}
      {isClicked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: 'rgba(var(--module-primary), 0.12)',
            borderRadius: '16px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};