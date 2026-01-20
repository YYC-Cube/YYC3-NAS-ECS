/**
 * @file Layout组件 - 应用程序的主要布局组件（优化版）
 * @description 遵循五高标准和五标规范的企业级布局系统
 * @features 3D边框视觉、边线阴影系统、四态交互、主题色彩映射
 * @module components/layout
 * @version 2.1.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Menu, X, Search, Settings, LogOut, Mail, Star, Trash2, 
  Tag, BarChart3, Inbox, Send, Calendar, FileText, HelpCircle, 
  PlusCircle, CheckCircle2, Sparkles, Bot, Zap, Shield, 
  LayoutDashboard, Server, Database, Globe, Network, Terminal, Users, HardDrive
} from 'lucide-react';

// 用户类型定义
interface User {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

// 侧边栏菜单项定义
interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  isActive?: boolean;
}

/**
 * 应用布局组件 - 优化版
 * 特性：
 * - 3D边框视觉（顶部浅色+左侧主色+右侧阴影色+底部深色）
 * - 边线阴影系统（3px静态/4px悬浮/5px激活）
 * - 四态交互（静态、悬浮、选中、激活）
 * - 模块主题色彩映射
 */
export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  });
  const [isMobile, setIsMobile] = useState(false);

  // 滚动阴影效果
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        const scrollTop = sidebarRef.current.scrollTop;
        const scrollHeight = sidebarRef.current.scrollHeight;
        const clientHeight = sidebarRef.current.clientHeight;
        const progress = Math.min(scrollTop / (scrollHeight - clientHeight), 1);
        setScrollProgress(progress);
      }
    };

    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      sidebarElement.addEventListener('scroll', handleScroll);
      return () => sidebarElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 响应式检测
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      };

      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

  // 侧边栏菜单 - 新结构
  const sidebarMenu: SidebarMenuItem[] = [
    { id: 'dashboard', label: '实时监控', icon: <LayoutDashboard className="h-5 w-5" />, path: '/' },
    { id: 'mail', label: 'MAIL服务', icon: <Mail className="h-5 w-5" />, path: '/mail', badge: 24 },
    { id: 'frp', label: 'FRP服务', icon: <Network className="h-5 w-5" />, path: '/frp' },
    { id: 'llm', label: 'LLM服务', icon: <Bot className="h-5 w-5" />, path: '/llm' },
    { id: 'ddns', label: 'DDNS服务', icon: <Globe className="h-5 w-5" />, path: '/ddns' },
    { id: 'nas', label: 'NAS服务', icon: <HardDrive className="h-5 w-5" />, path: '/nas' },
    { id: 'api', label: 'API服务', icon: <Server className="h-5 w-5" />, path: '/api' },
  ];

  // 系统管理
  const systemMenu: SidebarMenuItem[] = [
    { id: 'logs', label: '日志查看', icon: <Terminal className="h-5 w-5" />, path: '/system/logs' },
    { id: 'rbac', label: '权限管理', icon: <Users className="h-5 w-5" />, path: '/system/rbac' },
    { id: 'backup', label: '备份恢复', icon: <Database className="h-5 w-5" />, path: '/system/backup' },
  ];

  // 其他功能菜单项
  const otherMenu: SidebarMenuItem[] = [
    { id: 'settings', label: '设置', icon: <Settings className="h-5 w-5" />, path: '/settings' },
    { id: 'help', label: '帮助中心', icon: <HelpCircle className="h-5 w-5" />, path: '/help' },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 侧边栏 - 3D边框效果 */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.aside
            ref={sidebarRef}
            initial={isMobile ? { x: -264 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -264 } : {}}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed lg:relative z-30 w-64 h-full bg-white flex flex-col overflow-hidden"
            style={{
              /* 完整四边边框系统 - 侧边栏 */
              borderTop: '1px solid rgba(var(--module-cpu-primary), 0.15)',
              borderLeft: `4px solid var(--module-cpu-primary)`,
              borderRight: `2px solid var(--module-cpu-shadow)`,
              borderBottom: '1px solid rgba(var(--module-cpu-dark), 0.2)',
              boxShadow: `
                3px 0 8px rgba(42, 110, 187, ${0.15 + scrollProgress * 0.1}),
                inset -1px 0 2px rgba(42, 110, 187, 0.05)
              `,
            }}
          >
            {/* 侧边栏头部 - 3D边框 */}
            <div 
              className="flex items-center justify-between p-4 bg-white relative"
              style={{
                borderBottom: '2px solid var(--module-cpu-shadow)',
                borderTop: '1px solid rgba(var(--module-cpu-light), 0.3)',
                boxShadow: '0 2px 4px rgba(42, 110, 187, 0.08)',
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold shadow-md">
                  YS
                </div>
                <h1 style={{ color: 'var(--module-cpu-dark)' }} className="font-bold">IntelliManage</h1>
              </div>
              <button 
                onClick={toggleSidebar} 
                className="lg:hidden p-1 rounded-full transition-all duration-200"
                style={{
                  color: 'var(--module-cpu-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(42, 110, 187, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="关闭侧边栏"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 主要菜单项 */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-4 mb-6">
                <h3 
                  className="text-xs uppercase tracking-wider mb-2 px-2 font-semibold"
                  style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}
                >
                  核心服务
                </h3>
                <div className="space-y-1">
                  {sidebarMenu.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      isActive={currentPath === item.path}
                      onClick={() => handleNavigation(item.path)}
                    />
                  ))}
                </div>
              </div>

              {/* 系统管理 */}
              <div className="mb-6 px-4">
                <h3 
                  className="text-xs uppercase tracking-wider mb-2 px-2 font-semibold"
                  style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}
                >
                  基础设施
                </h3>
                <div className="space-y-1">
                  {systemMenu.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      isActive={currentPath === item.path}
                      onClick={() => handleNavigation(item.path)}
                    />
                  ))}
                </div>
              </div>

              {/* 其他功能 */}
              <div className="px-4">
                <h3 
                  className="text-xs uppercase tracking-wider mb-2 px-2 font-semibold"
                  style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}
                >
                  系统
                </h3>
                <div className="space-y-1">
                  {otherMenu.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      isActive={currentPath === item.path}
                      onClick={() => handleNavigation(item.path)}
                    />
                  ))}
                </div>
              </div>
            </nav>

            {/* 用户信息 - 3D边框 */}
            {user && (
              <div 
                className="p-4 bg-white relative"
                style={{
                  borderTop: '2px solid var(--module-cpu-shadow)',
                  borderBottom: '1px solid var(--module-cpu-dark)',
                  boxShadow: '0 -2px 4px rgba(42, 110, 187, 0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: 'rgba(42, 110, 187, 0.1)',
                        color: 'var(--module-cpu-primary)',
                        border: '2px solid var(--module-cpu-primary)',
                        boxShadow: '0 2px 4px rgba(42, 110, 187, 0.2)',
                      }}
                    >
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--module-cpu-dark)' }}>
                        {user.fullName || user.email}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.7 }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <IconButton
                    icon={<LogOut className="h-4 w-4" />}
                    onClick={handleLogout}
                    aria-label="登出"
                  />
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 - 3D边框效果 */}
        <header 
          className="bg-white z-20"
          style={{
            borderTop: '1px solid rgba(var(--module-cpu-light), 0.5)',
            borderBottom: `3px solid var(--module-cpu-shadow)`,
            boxShadow: '0 3px 8px rgba(42, 110, 187, 0.12)',
          }}
        >
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <IconButton
                icon={<Menu className="h-5 w-5" />}
                onClick={toggleSidebar}
                aria-label="打开侧边栏"
                className="lg:hidden"
              />
              
              {/* 搜索框 - 3D边框 */}
              <div className="ml-4 lg:ml-0 flex-1 max-w-md hidden md:block">
                <SearchBox />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 ml-4">
              <div className="hidden md:flex items-center gap-2 mr-4">
                <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  System Online
                </div>
              </div>
              <IconButton
                icon={<Bell className="h-5 w-5" />}
                onClick={() => {}}
                aria-label="通知"
                badge
              />
              <IconButton
                icon={<Settings className="h-5 w-5" />}
                onClick={() => handleNavigation('/settings')}
                aria-label="设置"
              />
              {user && <UserAvatar user={user} onLogout={handleLogout} />}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* 移动设备遮罩层 */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================== 子组件 ==================== */

/**
 * 菜单项组件 - 四态交互
 */
interface MenuItemProps {
  item: SidebarMenuItem;
  isActive: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // 边框宽度：静态3px / 悬浮4px / 激活5px
  const borderWidth = isPressed ? '5px' : isHovered ? '4px' : '3px';

  return (
    <motion.button
      className="w-full flex items-center h-12 px-3 rounded-md transition-all duration-200 relative overflow-hidden"
      style={{
        backgroundColor: isActive 
          ? 'var(--module-cpu-primary)' 
          : isHovered 
            ? 'rgba(42, 110, 187, 0.08)' 
            : 'transparent',
        color: isActive ? '#ffffff' : 'var(--module-cpu-dark)',
        borderLeft: `${borderWidth} solid ${isActive ? 'var(--module-cpu-shadow)' : 'transparent'}`,
        borderTop: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
        borderRight: isActive ? '1px solid var(--module-cpu-dark)' : '1px solid transparent',
        borderBottom: isActive ? '1px solid var(--module-cpu-dark)' : '1px solid transparent',
        boxShadow: isActive 
          ? '2px 2px 6px rgba(42, 110, 187, 0.3)' 
          : isHovered 
            ? '1px 1px 3px rgba(42, 110, 187, 0.15)' 
            : 'none',
        transform: isPressed ? 'translateY(1px)' : isHovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <motion.span
        className="mr-3 transition-transform duration-300"
        animate={{ rotate: isHovered ? 15 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {item.icon}
      </motion.span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span 
          className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs transition-all duration-200"
          style={{
            backgroundColor: isActive 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(42, 110, 187, 0.15)',
            color: isActive ? '#ffffff' : 'var(--module-cpu-primary)',
            border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.3)' : 'var(--module-cpu-primary)'}`,
          }}
        >
          {item.badge}
        </span>
      )}
    </motion.button>
  );
};

/**
 * 菜单按钮组件 - 主要/次要样式
 */
interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
  isSecondary?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, onClick, isPrimary, isSecondary }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const borderWidth = isPressed ? '5px' : isHovered ? '4px' : '3px';

  return (
    <motion.button
      className="w-full flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: isPrimary 
          ? 'var(--module-cpu-primary)' 
          : isHovered 
            ? 'rgba(42, 110, 187, 0.05)' 
            : 'transparent',
        color: isPrimary ? '#ffffff' : 'var(--module-cpu-primary)',
        borderTop: isPrimary ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(42, 110, 187, 0.2)',
        borderLeft: `${borderWidth} solid ${isPrimary ? 'var(--module-cpu-shadow)' : 'var(--module-cpu-primary)'}`,
        borderRight: isPrimary ? '2px solid var(--module-cpu-dark)' : '1px solid rgba(42, 110, 187, 0.15)',
        borderBottom: isPrimary ? '2px solid var(--module-cpu-dark)' : '1px solid rgba(42, 110, 187, 0.15)',
        boxShadow: isPrimary 
          ? '3px 3px 8px rgba(42, 110, 187, 0.3)' 
          : isHovered 
            ? '2px 2px 4px rgba(42, 110, 187, 0.15)' 
            : 'none',
        transform: isPressed ? 'translateY(2px)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </motion.button>
  );
};

/**
 * 图标按钮组件 - 四态交互
 */
interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  'aria-label': string;
  badge?: boolean;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, 'aria-label': ariaLabel, badge, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      className={`relative p-2.5 rounded-lg transition-all duration-200 ${className || ''}`}
      style={{
        backgroundColor: isHovered ? 'rgba(42, 110, 187, 0.08)' : 'rgba(0, 0, 0, 0)',
        color: 'var(--module-cpu-primary)',
        border: `2px solid ${isHovered ? 'var(--module-cpu-primary)' : 'rgba(0, 0, 0, 0)'}`,
        boxShadow: isPressed 
          ? '1px 1px 3px rgba(42, 110, 187, 0.2)' 
          : isHovered 
            ? '2px 2px 4px rgba(42, 110, 187, 0.15)' 
            : 'none',
        transform: isPressed ? 'scale(0.95)' : isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      aria-label={ariaLabel}
      whileHover={{ rotate: 5 }}
      whileTap={{ rotate: -5 }}
    >
      {icon}
      {badge && (
        <span 
          className="absolute top-1 right-1 block h-2 w-2 rounded-full"
          style={{
            backgroundColor: '#E74C3C',
            border: '1px solid #ffffff',
            boxShadow: '0 1px 2px rgba(231, 76, 60, 0.3)',
          }}
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
};

/**
 * 搜索框组件 - 3D边框+四交互
 */
const SearchBox: React.FC = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');

  const borderWidth = isFocused ? '4px' : '3px';

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search 
          className="h-4 w-4 transition-colors duration-200" 
          style={{ color: isFocused ? 'var(--module-cpu-primary)' : 'var(--module-cpu-shadow)' }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="block w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
        placeholder="搜索服务、日志、配置..."
        style={{
          backgroundColor: isFocused ? '#ffffff' : 'rgba(42, 110, 187, 0.03)',
          color: 'var(--module-cpu-dark)',
          borderTop: '1px solid rgba(42, 110, 187, 0.2)',
          borderLeft: `${borderWidth} solid var(--module-cpu-primary)`,
          borderRight: isFocused ? '2px solid var(--module-cpu-shadow)' : '1px solid rgba(42, 110, 187, 0.15)',
          borderBottom: isFocused ? '2px solid var(--module-cpu-shadow)' : '1px solid rgba(42, 110, 187, 0.15)',
          boxShadow: isFocused 
            ? '0 0 0 3px rgba(42, 110, 187, 0.1), 2px 2px 6px rgba(42, 110, 187, 0.15)' 
            : 'none',
        }}
      />
    </div>
  );
};

/**
 * 用户头像组件 - 下拉菜单
 */
interface UserAvatarProps {
  user: User;
  onLogout: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <motion.div
        className="flex items-center space-x-3 p-1.5 rounded-lg cursor-pointer transition-all duration-200"
        style={{
          backgroundColor: isOpen ? 'rgba(42, 110, 187, 0.08)' : 'rgba(0, 0, 0, 0)',
          border: `2px solid ${isOpen ? 'var(--module-cpu-primary)' : 'rgba(0, 0, 0, 0)'}`,
        }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="relative">
          <div 
            className="flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200"
            style={{
              backgroundColor: 'rgba(42, 110, 187, 0.1)',
              color: 'var(--module-cpu-primary)',
              border: '2px solid var(--module-cpu-primary)',
              boxShadow: '0 2px 4px rgba(42, 110, 187, 0.2)',
            }}
          >
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div 
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: '#27AE60',
              border: '2px solid #ffffff',
              boxShadow: '0 1px 2px rgba(39, 174, 96, 0.3)',
            }}
          />
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm" style={{ color: 'var(--module-cpu-dark)' }}>
            {user.fullName || user.email}
          </span>
          <span className="text-xs" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.7 }}>
            {user.email}
          </span>
        </div>
      </motion.div>

      {/* 下拉菜单 - 3D边框 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg z-50 overflow-hidden"
            style={{
              borderTop: '1px solid rgba(42, 110, 187, 0.2)',
              borderLeft: '3px solid var(--module-cpu-primary)',
              borderRight: '2px solid var(--module-cpu-shadow)',
              borderBottom: '2px solid var(--module-cpu-shadow)',
              boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
            }}
          >
            <div className="py-1">
              <DropdownItem label="个人资料" onClick={() => {}} />
              <DropdownItem label="账户设置" onClick={() => {}} />
              <div 
                className="my-1" 
                style={{ 
                  height: '1px', 
                  backgroundColor: 'var(--module-cpu-shadow)', 
                  opacity: 0.2 
                }}
              />
              <DropdownItem label="退出登录" onClick={onLogout} isDanger />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 下拉菜单项组件
 */
interface DropdownItemProps {
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ label, onClick, isDanger }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="w-full text-left block px-4 py-2 text-sm transition-all duration-200"
      style={{
        color: isDanger ? '#E74C3C' : 'var(--module-cpu-dark)',
        backgroundColor: isHovered 
          ? (isDanger ? 'rgba(231, 76, 60, 0.08)' : 'rgba(42, 110, 187, 0.05)') 
          : 'transparent',
        borderLeft: `3px solid ${isHovered ? (isDanger ? '#E74C3C' : 'var(--module-cpu-primary)') : 'transparent'}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default Layout;
