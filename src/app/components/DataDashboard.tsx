import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface DataDashboardProps {
  title: string;
  metrics: DataMetric[];
}

export const DataDashboard: React.FC<DataDashboardProps> = ({ title, metrics }) => {
  return (
    <div 
      className="rounded-lg p-6"
      style={{
        backgroundColor: 'rgba(var(--module-light-rgb), 0.03)',
        /* 完整四边边框系统 */
        borderTop: '1px solid rgba(var(--module-primary), 0.2)',
        borderLeft: '4px solid var(--module-shadow)',
        borderRight: '1px solid rgba(var(--module-shadow), 0.3)',
        borderBottom: '1px solid rgba(var(--module-dark), 0.2)',
        boxShadow: '2px 2px 8px rgba(var(--module-primary), 0.1)',
      }}
    >
      <h3 
        className="mb-6"
        style={{ color: 'var(--module-primary)' }}
      >
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            className="p-4 rounded-md"
            style={{
              backgroundColor: 'rgba(var(--module-light-rgb), 0.05)',
              /* 完整四边边框系统 */
              borderTop: '1px solid rgba(var(--module-primary), 0.15)',
              borderLeft: '3px solid var(--module-shadow)',
              borderRight: '1px solid rgba(var(--module-shadow), 0.25)',
              borderBottom: '1px solid rgba(var(--module-dark), 0.15)',
              boxShadow: '1px 1px 4px rgba(var(--module-primary), 0.08)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              y: -2,
              boxShadow: '2px 2px 6px rgba(var(--module-primary), 0.15)',
            }}
          >
            <div 
              className="mb-1 opacity-60"
              style={{ color: 'var(--module-primary)' }}
            >
              {metric.label}
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span 
                className="text-3xl"
                style={{ 
                  color: 'var(--module-primary)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                {metric.value}
              </span>
              {metric.unit && (
                <span 
                  style={{ 
                    color: 'var(--module-primary)',
                    opacity: 0.6,
                  }}
                >
                  {metric.unit}
                </span>
              )}
            </div>

            {metric.trend && (
              <div className="flex items-center gap-1">
                {metric.trend === 'up' && (
                  <TrendingUp 
                    size={16} 
                    style={{ 
                      color: 'var(--module-primary)',
                      transform: 'rotate(0deg)' 
                    }} 
                  />
                )}
                {metric.trend === 'down' && (
                  <TrendingDown 
                    size={16} 
                    style={{ 
                      color: 'var(--module-shadow)',
                      transform: 'rotate(0deg)' 
                    }} 
                  />
                )}
                {metric.trend === 'stable' && (
                  <Minus 
                    size={16} 
                    style={{ color: 'var(--module-dark)' }} 
                  />
                )}
                {metric.trendValue && (
                  <span 
                    style={{ 
                      color: 'var(--module-dark)',
                      opacity: 0.7,
                    }}
                  >
                    {metric.trendValue}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};