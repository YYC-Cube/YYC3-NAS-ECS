/**
 * @file EmailService.tsx - 邮件服务主组件（完整版 + Dashboard集成）
 * @description 集成完整企业邮箱系统与监控Dashboard功能
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
  LogOut,
  LayoutDashboard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { EmailList } from '../EmailList';
import { useTheme } from '../../contexts/ThemeContext';
import { ModuleCard } from '../ModuleCard';

/**
 * 邮件服务主组件
 */
export const EmailService: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  // 默认显示 Dashboard，保留原有功能体验
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'inbox' | 'sent' | 'starred' | 'drafts' | 'archive' | 'trash' | 'ai-assistant'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Dashboard 状态与逻辑 ---
  const [emailStats] = useState({
    pending: 12,
    sent: 1458,
    failed: 3
  });

  const [emailForm, setEmailForm] = useState({
    to: '',
    template: 'welcome'
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`测试邮件已发送至 ${emailForm.to} (模板: ${emailForm.template})`);
    setEmailForm(prev => ({ ...prev, to: '' }));
  };
  // ---------------------------

  // 主题切换器
  const ThemeSwitcher = () => (
    <div className="p-4 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
      <div className="text-xs mb-2 font-medium" style={{ color: 'var(--module-cpu-shadow)' }}>
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
              boxShadow: currentTheme === theme ? `0 2px 4px rgba(0, 0, 0, 0.1)` : 'none',
            }}
            onClick={() => setTheme(theme)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`切换到${theme}主题`}
          />
        ))}
      </div>
      <div className="text-xs mt-2 text-center text-gray-400">
        CPU | 内存 | 存储 | 网络 | 安全
      </div>
    </div>
  );

  // 菜单项数据
  const menuItems = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: '概览面板', count: 0 },
    { id: 'inbox' as const, icon: Inbox, label: '收件箱', count: 12 },
    { id: 'sent' as const, icon: Send, label: '已发送', count: 0 },
    { id: 'starred' as const, icon: Star, label: '星标邮件', count: 3 },
    { id: 'drafts' as const, icon: FileText, label: '草稿箱', count: 2 },
    { id: 'archive' as const, icon: Archive, label: '归档', count: 45 },
    { id: 'trash' as const, icon: Trash2, label: '回收站', count: 8 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      {/* 顶部导航栏 - 优化阴影和分割线 */}
      <header
        className="sticky top-0 z-40 bg-white"
        style={{
          borderBottom: '3px solid var(--module-cpu-primary)',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // 阴影灰效果
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 bg-[rgba(15,16,104,0)]">
          <div className="flex items-center justify-between">
            {/* Logo和标题 */}
            <div className="flex items-center space-x-3">
              <motion.div
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{
                  backgroundColor: 'var(--module-cpu-primary)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // 优化为灰色阴影
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
                <p className="text-sm text-gray-500">
                  Enterprise Email Management
                </p>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                />
                <input
                  type="text"
                  placeholder="搜索邮件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: '#f3f4f6', // gray-100
                    border: '1px solid transparent',
                    color: '#1f2937', // gray-800
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--module-cpu-primary)';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center space-x-3">
              <HeaderButton icon={<Settings className="h-5 w-5" />} label="设置" />
              <HeaderButton icon={<User className="h-5 w-5" />} label="个人中心" />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6 items-start"> {/* items-start 确保顶部对齐 */}
          {/* 左侧边栏 - 3D边框效果 + 阴影灰 */}
          <aside
            className="w-64 shrink-0 bg-white rounded-lg overflow-hidden sticky top-24" // 增加sticky效果
            style={{
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              borderLeft: '4px solid var(--module-cpu-primary)',
              borderRight: '1px solid rgba(0, 0, 0, 0.05)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', // 阴影灰
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
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
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
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
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
          <main className="flex-1 min-w-0"> {/* min-w-0 防止flex子项溢出 */}
            {/* 内容标题 */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--module-cpu-dark)' }}>
                  {menuItems.find(item => item.id === activeMenu)?.label || 'AI智能助手'}
                </h2>
                <p className="text-sm mt-1 text-gray-500">
                  {activeMenu === 'inbox' ? '您有 12 封未读邮件' : 
                   activeMenu === 'dashboard' ? '邮件服务运行状态概览' :
                   activeMenu === 'ai-assistant' ? 'AI驱动的智能邮件管理助手' :
                   '邮件管理'}
                </p>
              </div>
            </div>

            {/* --- 内容路由 --- */}
            
            {/* Dashboard View */}
            {activeMenu === 'dashboard' && (
              <div className="space-y-6">
                 <ModuleCard title="邮件队列状态" level={1}>
                  <div className="flex gap-8 justify-around p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
                        <Clock size={24} />
                        {emailStats.pending}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">待发送</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                        <CheckCircle size={24} />
                        {emailStats.sent}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">今日已发送</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
                        <AlertCircle size={24} />
                        {emailStats.failed}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">发送失败</div>
                    </div>
                  </div>
                </ModuleCard>

                <ModuleCard title="发送测试邮件" level={1}>
                  <form onSubmit={handleSend} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">收件人</label>
                      <input 
                        type="email" 
                        value={emailForm.to}
                        onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required 
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">模板</label>
                      <select 
                        value={emailForm.template}
                        onChange={(e) => setEmailForm({...emailForm, template: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="welcome">用户欢迎 (User Welcome)</option>
                        <option value="alert">系统告警 (System Alert)</option>
                        <option value="report">周报生成 (Weekly Report)</option>
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                    >
                      <Send size={16} />
                      发送
                    </button>
                  </form>
                </ModuleCard>
              </div>
            )}

            {/* Inbox View */}
            {activeMenu === 'inbox' && <EmailList />}
            
            {/* AI Assistant View */}
            {activeMenu === 'ai-assistant' && (
              <div
                className="bg-white rounded-lg p-8"
                style={{
                  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                  borderLeft: '4px solid var(--module-cpu-primary)',
                  borderRight: '1px solid rgba(0, 0, 0, 0.05)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', // 阴影灰
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
                  <p className="mb-6 text-gray-500">
                    智能分析邮件内容，提供快速回复建议和邮件分类
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <AIFeatureCard
                      icon={<Mail className="h-6 w-6" />}
                      title="��能回复"
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

            {/* Placeholder Views */}
            {activeMenu !== 'inbox' && activeMenu !== 'ai-assistant' && activeMenu !== 'dashboard' && (
              <div
                className="bg-white rounded-lg p-12 text-center"
                style={{
                  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                  borderLeft: '4px solid var(--module-cpu-primary)',
                  borderRight: '1px solid rgba(0, 0, 0, 0.05)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', // 阴影灰
                }}
              >
                <div className="text-gray-400 opacity-60">
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
        color: isHovered ? 'var(--module-cpu-primary)' : '#6b7280', // gray-500
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
        color: isActive ? '#ffffff' : isHovered ? 'var(--module-cpu-dark)' : '#4b5563', // gray-600
        borderLeft: `3px solid ${isActive ? 'var(--module-cpu-dark)' : 'transparent'}`,
        boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none', // 优化阴影
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
        border: `1px solid ${isHovered ? 'var(--module-cpu-primary)' : 'rgba(0, 0, 0, 0.05)'}`,
        boxShadow: isHovered ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // 阴影灰
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
      <p className="text-sm text-gray-500">
        {description}
      </p>
    </motion.div>
  );
};
