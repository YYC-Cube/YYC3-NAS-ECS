'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus2, Maximize2, MessageSquare, Settings, Sparkles } from 'lucide-react';
import { useAIWidget } from '@/lib/ai-components/useAIComponents';

interface IntelligentAIWidgetProps {
  agenticCore?: any;
  onClose?: () => void;
  className?: string;
}

export function IntelligentAIWidget({ agenticCore, onClose, className = '' }: IntelligentAIWidgetProps) {
  const { widgetState, hideWidget, minimizeWidget, maximizeWidget, updatePosition, updateSize } = useAIWidget();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'insights'>('chat');
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...widgetState.position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = startPos.x + (moveEvent.clientX - startX);
      const newY = startPos.y + (moveEvent.clientY - startY);
      updatePosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...widgetState.size };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(300, startSize.width + (moveEvent.clientX - startX));
      const newHeight = Math.max(400, startSize.height + (moveEvent.clientY - startY));
      updateSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!widgetState.isOpen) return null;

  return (
    <AnimatePresence>
      {widgetState.isOpen && (
        <motion.div
          ref={widgetRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: widgetState.position.y,
            x: widgetState.position.x
          }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            width: widgetState.size.width,
            height: widgetState.size.height,
            zIndex: widgetState.zIndex,
            display: widgetState.isMinimized ? 'none' : 'block'
          }}
          className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
        >
          <div
            ref={dragHandleRef}
            onMouseDown={handleMouseDown}
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">YYC³ AI助手</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={minimizeWidget}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="最小化"
              >
                <Minus2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={maximizeWidget}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={widgetState.isMaximized ? '还原' : '最大化'}
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={hideWidget}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">对话</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 px-4 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'tools'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">工具</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-4 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'insights'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">洞察</span>
            </button>
          </div>

          <div 
            className="flex-1 overflow-auto p-4"
            style={{ height: widgetState.size.height - 120 }}
          >
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      AI助手已就绪，可以开始对话了。
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入您的问题..."
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                      发送
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto space-y-2">
                  {['搜索工具', '计算器', '翻译', '代码生成'].map((tool, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{tool}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        快速访问常用工具和功能
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">系统洞察</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">系统状态</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">正常</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">响应时间</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">~120ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">组件数量</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">8/8</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            ref={resizeHandleRef}
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-500/20 rounded-bl-lg transition-colors"
          >
            <div className="w-2 h-2 border-b-2 border-r-2 border-gray-400 dark:border-gray-600" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AIWidgetTrigger({ className = '' }: { className?: string }) {
  const { toggleWidget } = useAIWidget();

  return (
    <button
      onClick={toggleWidget}
      className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${className}`}
    >
      <Sparkles className="w-5 h-5" />
      <span className="font-medium">AI助手</span>
    </button>
  );
}
