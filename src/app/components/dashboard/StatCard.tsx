import React from 'react';
import { ModuleCard } from '../ModuleCard';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'red';
  trend?: number; // Optional trend percentage
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color = 'blue',
  trend
}) => {
  // Map colors to theme variables or hex values
  const colorMap = {
    blue: 'var(--module-cpu-primary)',
    green: 'var(--module-memory-primary)',
    orange: 'var(--module-network-primary)',
    red: 'var(--module-security-primary)',
  };

  const iconColor = colorMap[color];

  return (
    <ModuleCard title={title} level={2}>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline space-x-1">
            <motion.span 
              className="text-3xl font-bold"
              style={{ color: 'var(--module-dark)' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              key={Number(value)} // Animate on change
            >
              {value}
            </motion.span>
            {unit && (
              <span className="text-sm font-medium text-gray-500">{unit}</span>
            )}
          </div>
          {trend !== undefined && (
            <div className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% 环比
            </div>
          )}
        </div>
        <div 
          className="p-3 rounded-lg opacity-80"
          style={{ backgroundColor: `${iconColor}15` }} // 15% opacity
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
      </div>
    </ModuleCard>
  );
};
