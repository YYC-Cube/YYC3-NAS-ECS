import React from 'react';
import { motion } from 'motion/react';

interface ModuleProgressProps {
  label: string;
  value: number; // 0-100
  showPercentage?: boolean;
}

export const ModuleProgress: React.FC<ModuleProgressProps> = ({ 
  label, 
  value,
  showPercentage = true 
}) => {
  const isHighValue = value > 80;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span style={{ color: 'var(--module-dark)' }}>
          {label}
        </span>
        {showPercentage && (
          <span 
            style={{ 
              color: 'var(--module-primary)',
            }}
          >
            {value}%
          </span>
        )}
      </div>
      
      <div 
        className="h-2 rounded-full overflow-hidden"
        style={{
          backgroundColor: '#e5e7eb',
          border: '1px solid var(--module-shadow)',
        }}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: isHighValue
              ? `linear-gradient(90deg, var(--module-shadow), var(--module-dark))`
              : `linear-gradient(90deg, var(--module-primary), var(--module-shadow))`,
          }}
          initial={{ width: 0 }}
          animate={{ 
            width: `${value}%`,
            opacity: isHighValue ? [1, 0.98, 1] : 1,
          }}
          transition={{ 
            width: { duration: 0.5, ease: 'easeOut' },
            opacity: isHighValue 
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0 }
          }}
        />
      </div>
    </div>
  );
};
