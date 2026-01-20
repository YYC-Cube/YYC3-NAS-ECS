import React, { useState, ReactNode } from 'react';
import { motion } from 'motion/react';

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface ModuleTabsProps {
  tabs: TabItem[];
}

export const ModuleTabs: React.FC<ModuleTabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex gap-2 mb-6 border-b-2" style={{ borderColor: 'rgba(var(--module-shadow), 0.2)' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-6 py-3 transition-all duration-200"
              style={{
                color: isActive ? 'var(--module-primary)' : 'var(--module-dark)',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {tab.label}
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--module-primary)' }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabs.find(tab => tab.id === activeTab)?.content}
      </motion.div>
    </div>
  );
};
