/**
 * @file QuickActions - 快捷操作组件
 * @description 提供常用操作的快速访问和快捷键支持
 * @module components/QuickActions
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-25
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Star, 
  ChevronDown, 
  X,
  Keyboard,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Copy,
  Settings,
  HelpCircle,
  Search,
  LayoutDashboard,
  Mail,
  Network,
  Bot,
  Globe,
  HardDrive,
  Server
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'recent' | 'favorite' | 'system';
}

interface QuickActionsProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'dashboard',
    label: '实时监控',
    icon: <LayoutDashboard className="w-4 h-4" />,
    shortcut: 'Ctrl+1',
    action: () => {},
    category: 'favorite'
  },
  {
    id: 'mail',
    label: '邮件服务',
    icon: <Mail className="w-4 h-4" />,
    shortcut: 'Ctrl+2',
    action: () => {},
    category: 'favorite'
  },
  {
    id: 'llm',
    label: 'LLM服务',
    icon: <Bot className="w-4 h-4" />,
    shortcut: 'Ctrl+3',
    action: () => {},
    category: 'favorite'
  },
  {
    id: 'frp',
    label: 'FRP服务',
    icon: <Network className="w-4 h-4" />,
    shortcut: 'Ctrl+4',
    action: () => {},
    category: 'favorite'
  },
  {
    id: 'ddns',
    label: 'DDNS服务',
    icon: <Globe className="w-4 h-4" />,
    shortcut: 'Ctrl+5',
    action: () => {},
    category: 'favorite'
  },
  {
    id: 'nas',
    label: 'NAS服务',
    icon: <HardDrive className="w-4 h-4" />,
    shortcut: 'Ctrl+6',
    action: () => {},
    category: 'favorite'
  },
  {
    id: 'api',
    label: 'API服务',
    icon: <Server className="w-4 h-4" />,
    shortcut: 'Ctrl+7',
    action: () => {},
    category: 'favorite'
  }
];

const SYSTEM_ACTIONS: QuickAction[] = [
  {
    id: 'refresh',
    label: '刷新页面',
    icon: <RefreshCw className="w-4 h-4" />,
    shortcut: 'F5',
    action: () => window.location.reload(),
    category: 'system'
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: <Settings className="w-4 h-4" />,
    shortcut: 'Ctrl+,',
    action: () => {},
    category: 'system'
  },
  {
    id: 'help',
    label: '帮助中心',
    icon: <HelpCircle className="w-4 h-4" />,
    shortcut: 'F1',
    action: () => {},
    category: 'system'
  },
  {
    id: 'search',
    label: '全局搜索',
    icon: <Search className="w-4 h-4" />,
    shortcut: 'Ctrl+Shift+F',
    action: () => {},
    category: 'system'
  }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quick-actions-favorites');
      return saved ? JSON.parse(saved) : ['dashboard', 'mail', 'llm'];
    } catch {
      return ['dashboard', 'mail', 'llm'];
    }
  });
  const [recentActions, setRecentActions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quick-actions-recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allActions = [...DEFAULT_QUICK_ACTIONS, ...SYSTEM_ACTIONS].map(action => ({
    ...action,
    action: () => {
      if (SYSTEM_ACTIONS.find(a => a.id === action.id)) {
        SYSTEM_ACTIONS.find(a => a.id === action.id)?.action();
      } else {
        const path = '/' + action.id;
        onNavigate(path);
      }
      addToRecent(action.id);
      setIsOpen(false);
    }
  }));

  const addToRecent = useCallback((actionId: string) => {
    setRecentActions(prev => {
      const filtered = prev.filter(id => id !== actionId);
      const updated = [actionId, ...filtered].slice(0, 10);
      localStorage.setItem('quick-actions-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((actionId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId];
      localStorage.setItem('quick-actions-favorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const filteredActions = allActions.filter(action => {
    const query = searchQuery.toLowerCase();
    return action.label.toLowerCase().includes(query) || 
           action.shortcut?.toLowerCase().includes(query);
  });

  const favoriteActions = filteredActions.filter(action => favorites.includes(action.id));
  const recentActionsFiltered = filteredActions.filter(action => recentActions.includes(action.id));
  const otherActions = filteredActions.filter(action => 
    !favorites.includes(action.id) && !recentActions.includes(action.id)
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowKeyboardShortcuts(false);
      }

      if (e.key === '?' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const renderActionItem = (action: QuickAction) => (
    <motion.button
      key={action.id}
      onClick={action.action}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors group"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-md transition-colors"
          style={{
            backgroundColor: favorites.includes(action.id) 
              ? 'rgba(42, 110, 187, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            color: favorites.includes(action.id) 
              ? 'var(--module-cpu-primary)' 
              : 'var(--module-cpu-dark)'
          }}
        >
          {action.icon}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--module-cpu-dark)' }}>
          {action.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {action.shortcut && (
          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 rounded text-gray-600">
            {action.shortcut}
          </kbd>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(action.id);
          }}
          className={`p-1.5 rounded transition-colors ${
            favorites.includes(action.id) 
              ? 'text-yellow-500 hover:bg-yellow-50' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          <Star 
            className={`w-4 h-4 ${favorites.includes(action.id) ? 'fill-current' : ''}`} 
          />
        </button>
      </div>
    </motion.button>
  );

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 rounded-lg transition-all duration-200"
        style={{
          backgroundColor: 'rgba(42, 110, 187, 0.08)',
          color: 'var(--module-cpu-primary)',
          border: '2px solid var(--module-cpu-primary)',
          boxShadow: '2px 2px 4px rgba(42, 110, 187, 0.15)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="快捷操作 (Ctrl+K)"
      >
        <Zap className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-4 w-[480px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索操作... (Ctrl+K)"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                    className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="快捷键列表"
                  >
                    <Keyboard className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {searchQuery === '' && favoriteActions.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--module-cpu-dark)' }}>
                        收藏夹
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {favoriteActions.map(renderActionItem)}
                    </div>
                  </div>
                )}

                {searchQuery === '' && recentActionsFiltered.length > 0 && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--module-cpu-dark)' }}>
                        最近使用
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {recentActionsFiltered.map(renderActionItem)}
                    </div>
                  </div>
                )}

                <div className={`p-4 ${searchQuery === '' ? 'border-t border-gray-100' : ''}`}>
                  {searchQuery === '' && (
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--module-cpu-dark)' }}>
                      所有操作
                    </h3>
                  )}
                  <div className="space-y-1">
                    {otherActions.length > 0 ? (
                      otherActions.map(renderActionItem)
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">未找到匹配的操作</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>按 <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Esc</kbd> 关闭</span>
                  <span>按 <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+K</kbd> 打开</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKeyboardShortcuts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowKeyboardShortcuts(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--module-cpu-dark)' }}>
                  键盘快捷键
                </h2>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--module-cpu-dark)' }}>
                      导航快捷键
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {DEFAULT_QUICK_ACTIONS.map(action => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {action.icon}
                            <span className="text-sm">{action.label}</span>
                          </div>
                          <kbd className="px-2 py-1 text-xs font-mono bg-white rounded border border-gray-200">
                            {action.shortcut}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--module-cpu-dark)' }}>
                      系统快捷键
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {SYSTEM_ACTIONS.map(action => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {action.icon}
                            <span className="text-sm">{action.label}</span>
                          </div>
                          <kbd className="px-2 py-1 text-xs font-mono bg-white rounded border border-gray-200">
                            {action.shortcut}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--module-cpu-dark)' }}>
                      其他快捷键
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">打开快捷操作面板</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-white rounded border border-gray-200">
                          Ctrl+K
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">显示快捷键列表</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-white rounded border border-gray-200">
                          Ctrl+Shift+?
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">关闭面板</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-white rounded border border-gray-200">
                          Esc
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
