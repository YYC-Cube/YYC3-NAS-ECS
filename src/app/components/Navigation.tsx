import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Database, HardDrive, Network, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  theme: 'cpu' | 'memory' | 'storage' | 'network' | 'security';
}

interface NavigationProps {
  onThemeChange?: (theme: 'cpu' | 'memory' | 'storage' | 'network' | 'security') => void;
}

const navItems: NavItem[] = [
  { id: 'cpu', icon: Cpu, label: 'CPU管理', theme: 'cpu' },
  { id: 'memory', icon: Database, label: '内存监控', theme: 'memory' },
  { id: 'storage', icon: HardDrive, label: '存储系统', theme: 'storage' },
  { id: 'network', icon: Network, label: '网络配置', theme: 'network' },
  { id: 'security', icon: Shield, label: '安全中心', theme: 'security' },
];

export const Navigation: React.FC<NavigationProps> = ({ onThemeChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [activeId, setActiveId] = useState('cpu');
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleItemClick = (item: NavItem) => {
    setActiveId(item.id);
    onThemeChange?.(item.theme);
  };

  return (
    <motion.nav
      initial={{ width: 240 }}
      animate={{ width: expanded ? 240 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 p-4 z-50"
    >
      {/* 展开/收缩按钮 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
        style={{
          color: 'var(--module-primary)',
        }}
      >
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* 导航项列表 */}
      <div className="mt-12 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                relative w-full h-12 rounded-md overflow-hidden
                transition-all duration-200
                ${isActive ? 'scale-[1.02]' : ''}
              `}
              style={{
                borderRight: `3px solid var(--module-${item.theme}-shadow)`,
                backgroundColor: isActive 
                  ? `var(--module-${item.theme}-light)` 
                  : 'transparent',
                opacity: isScrolling ? 0.8 : 1,
              }}
              whileHover={{ y: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center px-3 h-full gap-3">
                {/* 图标 */}
                <motion.div
                  animate={{
                    rotate: isActive ? 30 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    color: `var(--module-${item.theme}-primary)`,
                    opacity: 0.8,
                  }}
                >
                  <Icon size={20} />
                </motion.div>

                {/* 文本 */}
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      color: `var(--module-${item.theme}-dark)`,
                    }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>

              {/* 激活态内阴影 */}
              {isActive && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px var(--module-${item.theme}-primary)`,
                    opacity: 0.15,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
