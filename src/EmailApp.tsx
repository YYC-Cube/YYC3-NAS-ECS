/**
 * @file 独立企业邮箱系统应用
 * @description 遵循五高标准和五标规范的企业邮箱系统（独立版本）
 * @features 完整的邮件管理系统，包含导航、AI助手、主题切换等功能
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Send, 
  Archive, 
  Star, 
  Trash2, 
  Settings, 
  Search, 
  Plus,
  Inbox,
  FileText,
  Clock,
  Sparkles,
  User,
  LogOut
} from 'lucide-react';
import { EmailList } from './app/components/EmailList';
import { ThemeProvider, useTheme } from './ThemeContext';

/**
 * 企业邮箱系统主应用组件
 */
const EmailAppContent: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<'inbox' | 'sent' | 'starred' | 'drafts' | 'archive' | 'trash' | 'ai-assistant'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // 主题切换器
  const ThemeSwitcher = () => (
    <div className="p-4 border-t" style={{ borderColor: 'rgba(42, 110, 187, 0.1)' }}>
      <div className="text-xs mb-2" style={{ color: 'var(--module-cpu-shadow)' }}>
        主题模块
      </div>
      <div className="grid grid-cols-5 gap-2">
        {(['cpu', 'memory', 'storage', 'network', 'security'] as const).map((theme) => (
          <motion.button
            key={theme}
            className="h-8 rounded transition-all duration-200"
            style={{
              backgroundColor: currentTheme === theme 
                ? `var(--module-${theme}-primary)` 
                : `var(--module-${theme}-light)`,
              border: `2px solid ${currentTheme === theme ? `var(--module-${theme}-primary)` : 'transparent'}`,
              boxShadow: currentTheme === theme ? `2px 2px 6px rgba(0, 0, 0, 0.1)` : 'none',
            }}
            onClick={() => setTheme(theme)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`切换到${theme}主题`}
          />
        ))}
      </div>
      <div className="text-xs mt-2 text-center" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}>
        CPU | 内存 | 存储 | 网络 | 安全
      </div>
    </div>
  );

  // 菜单项数据
  const menuItems = [
    { id: 'inbox' as const, icon: Inbox, label: '收件箱', count: 12 },
    { id: 'sent' as const, icon: Send, label: '已发送', count: 0 },
    { id: 'starred' as const, icon: Star, label: '星标邮件', count: 3 },
    { id: 'drafts' as const, icon: FileText, label: '草稿箱', count: 2 },
    { id: 'archive' as const, icon: Archive, label: '归档', count: 45 },
    { id: 'trash' as const, icon: Trash2, label: '回收站', count: 8 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      {/* 顶部导航栏 - 3D边框效果 */}
      <header
        className="sticky top-0 z-50 bg-white"
        style={{
          borderBottom: '3px solid var(--module-cpu-primary)',
          boxShadow: '0 3px 12px rgba(42, 110, 187, 0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo和标题 */}
            <div className="flex items-center space-x-3">
              <motion.div
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{
                  backgroundColor: 'var(--module-cpu-primary)',
                  boxShadow: '3px 3px 8px rgba(42, 110, 187, 0.3)',
                }}
                whileHover={{ rotate: 5, scale: 1.05 }}
                whileTap={{ rotate: -5, scale: 0.95 }}
              >
                <Mail className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--module-cpu-dark)' }}>
                  企业邮箱系统
                </h1>
                <p className="text-sm" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}>
                  Enterprise Email Management
                </p>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                  style={{ color: 'var(--module-cpu-shadow)' }}
                />
                <input
                  type="text"
                  placeholder="搜索邮件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--module-cpu-light)',
                    border: '2px solid transparent',
                    color: 'var(--module-cpu-dark)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--module-cpu-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(42, 110, 187, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center space-x-3">
              <HeaderButton icon={<Settings className="h-5 w-5" />} label="设置" />
              <HeaderButton icon={<User className="h-5 w-5" />} label="个人中心" />
              <HeaderButton icon={<LogOut className="h-5 w-5" />} label="退出登录" />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* 左侧边栏 - 3D边框效果 */}
          <aside
            className="w-64 shrink-0 bg-white rounded-lg overflow-hidden"
            style={{
              borderTop: '1px solid rgba(42, 110, 187, 0.2)',
              borderLeft: '4px solid var(--module-cpu-primary)',
              borderRight: '2px solid var(--module-cpu-shadow)',
              borderBottom: '2px solid var(--module-cpu-shadow)',
              boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
              height: 'fit-content',
            }}
          >
            {/* 撰写按钮 */}
            <div className="p-4">
              <motion.button
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: 'var(--module-cpu-primary)',
                  color: '#ffffff',
                  boxShadow: '2px 2px 8px rgba(42, 110, 187, 0.3)',
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">撰写邮件</span>
              </motion.button>
            </div>

            {/* 菜单列表 */}
            <nav className="px-2 pb-4">
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  count={item.count}
                  isActive={activeMenu === item.id}
                  onClick={() => setActiveMenu(item.id)}
                />
              ))}

              {/* AI助手特殊入口 */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(42, 110, 187, 0.1)' }}>
                <SidebarMenuItem
                  icon={Sparkles}
                  label="AI智能助手"
                  isActive={activeMenu === 'ai-assistant'}
                  onClick={() => setActiveMenu('ai-assistant')}
                  isSpecial
                />
              </div>
            </nav>

            {/* 主题切换器 */}
            <ThemeSwitcher />
          </aside>

          {/* 主内容区 */}
          <main className="flex-1">
            {/* 内容标题 */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--module-cpu-dark)' }}>
                  {menuItems.find(item => item.id === activeMenu)?.label || 'AI智能助手'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}>
                  {activeMenu === 'inbox' ? '您有 12 封未读邮件' : 
                   activeMenu === 'ai-assistant' ? 'AI驱动的智能邮件管理助手' :
                   '邮件管理'}
                </p>
              </div>
            </div>

            {/* 根据选中的菜单显示不同内容 */}
            {activeMenu === 'inbox' && <EmailList />}
            
            {activeMenu === 'ai-assistant' && (
              <div
                className="bg-white rounded-lg p-8"
                style={{
                  borderTop: '1px solid rgba(42, 110, 187, 0.2)',
                  borderLeft: '4px solid var(--module-cpu-primary)',
                  borderRight: '2px solid var(--module-cpu-shadow)',
                  borderBottom: '2px solid var(--module-cpu-shadow)',
                  boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
                }}
              >
                <div className="text-center">
                  <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                    style={{
                      backgroundColor: 'var(--module-cpu-light)',
                      border: '3px solid var(--module-cpu-primary)',
                    }}
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="h-10 w-10" style={{ color: 'var(--module-cpu-primary)' }} />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--module-cpu-dark)' }}>
                    AI智能助手
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--module-cpu-shadow)' }}>
                    智能分析邮件内容，提供快速回复建议和邮件分类
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <AIFeatureCard
                      icon={<Mail className="h-6 w-6" />}
                      title="智能回复"
                      description="基于邮件内容自动生成回复建议"
                    />
                    <AIFeatureCard
                      icon={<FileText className="h-6 w-6" />}
                      title="内容总结"
                      description="快速提炼长邮件的关键信息"
                    />
                    <AIFeatureCard
                      icon={<Clock className="h-6 w-6" />}
                      title="优先级排序"
                      description="智能识别重要邮件并优先展示"
                    />
                    <AIFeatureCard
                      icon={<Archive className="h-6 w-6" />}
                      title="自动分类"
                      description="将邮件自动归档到相应文件夹"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeMenu !== 'inbox' && activeMenu !== 'ai-assistant' && (
              <div
                className="bg-white rounded-lg p-12 text-center"
                style={{
                  borderTop: '1px solid rgba(42, 110, 187, 0.2)',
                  borderLeft: '4px solid var(--module-cpu-primary)',
                  borderRight: '2px solid var(--module-cpu-shadow)',
                  borderBottom: '2px solid var(--module-cpu-shadow)',
                  boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
                }}
              >
                <div style={{ color: 'var(--module-cpu-shadow)', opacity: 0.6 }}>
                  <Mail className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">该功能正在开发中...</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

/* ==================== 子组件 ==================== */

/**
 * 头部按钮组件
 */
interface HeaderButtonProps {
  icon: React.ReactNode;
  label: string;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ icon, label }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      className="p-2 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: isHovered ? 'var(--module-cpu-light)' : 'transparent',
        color: 'var(--module-cpu-primary)',
        border: `2px solid ${isHovered ? 'var(--module-cpu-primary)' : 'transparent'}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
};

/**
 * 侧边栏菜单项组件
 */
interface SidebarMenuItemProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  isSpecial?: boolean;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({ 
  icon: Icon, 
  label, 
  count, 
  isActive, 
  onClick,
  isSpecial 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200"
      style={{
        backgroundColor: isActive 
          ? 'var(--module-cpu-primary)' 
          : isHovered 
            ? 'var(--module-cpu-light)' 
            : 'transparent',
        color: isActive ? '#ffffff' : 'var(--module-cpu-dark)',
        borderLeft: `3px solid ${isActive ? 'var(--module-cpu-dark)' : 'rgba(0, 0, 0, 0)'}`,
        boxShadow: isActive ? '2px 2px 6px rgba(42, 110, 187, 0.2)' : 'none',
        transform: isHovered && !isActive ? 'translateX(2px)' : 'translateX(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={!isActive ? { x: 2 } : {}}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${isSpecial ? 'animate-pulse' : ''}`} />
        <span className="font-medium">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--module-cpu-primary)',
            color: isActive ? '#ffffff' : '#ffffff',
          }}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};

/**
 * AI功能卡片组件
 */
interface AIFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AIFeatureCard: React.FC<AIFeatureCardProps> = ({ icon, title, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="p-6 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: isHovered ? 'var(--module-cpu-light)' : '#ffffff',
        border: `2px solid ${isHovered ? 'var(--module-cpu-primary)' : 'rgba(42, 110, 187, 0.2)'}`,
        boxShadow: isHovered ? '3px 3px 12px rgba(42, 110, 187, 0.2)' : '2px 2px 6px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3"
        style={{
          backgroundColor: 'var(--module-cpu-primary)',
          color: '#ffffff',
        }}
      >
        {icon}
      </div>
      <h4 className="font-semibold mb-2" style={{ color: 'var(--module-cpu-dark)' }}>
        {title}
      </h4>
      <p className="text-sm" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}>
        {description}
      </p>
    </motion.div>
  );
};

/**
 * 邮箱应用根组件（带主题提供器）
 */
export const EmailApp: React.FC = () => {
  return (
    <ThemeProvider>
      <EmailAppContent />
    </ThemeProvider>
  );
};

export default EmailApp;
