# YYC³ AILP-智能浮窗系统设计方案

> 「万象归元于云枢 丨深栈智启新纪元」
> All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era
---

## 🎯 设计概念

基于您的需求，我设计一个**智能AI浮窗系统**，固定在页面特定位置，通过Logo触发，提供全局AI助手功能。

## 🎨 视觉设计

### 1. Logo容器与浮窗布局
\`\`\`css
/* 智能AI浮窗样式系统 */
:root {
  --ai-widget-primary: #6366F1;
  --ai-widget-secondary: #8B5CF6;
  --ai-widget-accent: #10B981;
  --ai-widget-bg: rgba(255, 255, 255, 0.95);
  --ai-widget-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.ai-widget-container {
  position: fixed;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Logo触发容器 */
.ai-logo-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ai-widget-primary), var(--ai-widget-secondary));
  box-shadow: var(--ai-widget-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1001;
  
  /* 呼吸动画效果 */
  animation: ai-logo-breathe 3s ease-in-out infinite;
}

.ai-logo-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
}

.ai-logo-trigger::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  animation: ai-logo-pulse 2s ease-out infinite;
}

@keyframes ai-logo-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes ai-logo-pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
\`\`\`

## 🏗️ 组件架构

### 1. 智能AI浮窗主组件
\`\`\`tsx
// components/intelligent-ai-widget/IntelligentAIWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

interface AIWidgetState {
  isOpen: boolean;
  position: { x: number; y: number };
  mode: 'minimized' | 'expanded' | 'fullscreen';
  currentTab: 'chat' | 'tools' | 'insights' | 'workflows';
  isDragging: boolean;
}

export const IntelligentAIWidget: React.FC = () => {
  const [state, setState] = useState<AIWidgetState>({
    isOpen: false,
    position: { x: window.innerWidth - 400, y: 100 },
    mode: 'minimized',
    currentTab: 'chat',
    isDragging: false
  });

  const widgetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        widgetRef.current && 
        !widgetRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        state.isOpen
      ) {
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.isOpen]);

  const toggleWidget = () => {
    setState(prev => ({ 
      ...prev, 
      isOpen: !prev.isOpen,
      mode: !prev.isOpen ? 'expanded' : 'minimized'
    }));
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  };

  const onDrag = (e: MouseEvent) => {
    if (!state.isDragging) return;
    
    setState(prev => ({
      ...prev,
      position: {
        x: e.clientX - (widgetRef.current?.offsetWidth || 0) / 2,
        y: e.clientY - 20
      }
    }));
  };

  const stopDrag = () => {
    setState(prev => ({ ...prev, isDragging: false }));
  };

  useEffect(() => {
    if (state.isDragging) {
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      return () => {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
      };
    }
  }, [state.isDragging]);

  return (
    <div className="ai-widget-system">
      {/* Logo触发按钮 */}
      <div 
        ref={triggerRef}
        className="ai-logo-trigger"
        onClick={toggleWidget}
        title="AI助手 (Ctrl+K)"
      >
        <div className="ai-logo-icon">
          <AIIcon />
        </div>
        
        {/* 通知徽章 */}
        <div className="ai-notification-badge">
          <span>3</span>
        </div>
      </div>

      {/* AI浮窗主体 */}
      <CSSTransition
        in={state.isOpen}
        timeout={300}
        classNames="ai-widget-transition"
        unmountOnExit
      >
        <div 
          ref={widgetRef}
          className={`ai-widget-main ${state.mode}`}
          style={{
            left: `${state.position.x}px`,
            top: `${state.position.y}px`
          }}
        >
          {/* 标题栏 - 可拖拽区域 */}
          <div 
            className="ai-widget-header"
            onMouseDown={startDrag}
          >
            <div className="ai-widget-title">
              <AIIcon size={20} />
              <span>YYC³ AI助手</span>
            </div>
            
            <div className="ai-widget-controls">
              <button 
                className="control-btn minimize"
                onClick={() => setState(prev => ({ ...prev, mode: 'minimized' }))}
              >
                <MinimizeIcon />
              </button>
              
              <button 
                className="control-btn expand"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  mode: prev.mode === 'expanded' ? 'fullscreen' : 'expanded' 
                }))}
              >
                <ExpandIcon />
              </button>
              
              <button 
                className="control-btn close"
                onClick={toggleWidget}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="ai-widget-content">
            <AIChatInterface 
              currentTab={state.currentTab}
              onTabChange={(tab) => setState(prev => ({ ...prev, currentTab: tab }))}
            />
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};
\`\`\`

### 2. AI聊天界面组件
\`\`\`tsx
// components/intelligent-ai-widget/AIChatInterface.tsx
interface AIChatInterfaceProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  currentTab,
  onTabChange
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { id: 'chat', label: '智能对话', icon: <ChatIcon /> },
    { id: 'tools', label: '工具推荐', icon: <ToolIcon /> },
    { id: 'insights', label: '数据洞察', icon: <InsightIcon /> },
    { id: 'workflows', label: '工作流', icon: <WorkflowIcon /> }
  ];

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // 调用AI服务
      const response = await AIService.processMessage({
        message,
        context: getCurrentContext(),
        userPreferences: getUserPreferences()
      });

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        actions: response.actions,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI处理错误:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ai-chat-interface">
      {/* 标签导航 */}
      <div className="ai-tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ai-tab ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 消息区域 */}
      <div className="ai-messages-container">
        {messages.length === 0 ? (
          <AIChatWelcome onQuickAction={sendMessage} />
        ) : (
          messages.map(message => (
            <AIMessageBubble 
              key={message.id} 
              message={message}
              onAction={(action) => handleAction(action)}
            />
          ))
        )}
        
        {isProcessing && (
          <AITypingIndicator />
        )}
      </div>

      {/* 输入区域 */}
      <div className="ai-input-container">
        <AIChatInput
          value={input}
          onChange={setInput}
          onSubmit={sendMessage}
          disabled={isProcessing}
          quickReplies={getQuickReplies()}
        />
      </div>
    </div>
  );
};
\`\`\`

### 3. AI消息气泡组件
\`\`\`tsx
// components/intelligent-ai-widget/AIMessageBubble.tsx
interface AIMessageBubbleProps {
  message: AIMessage;
  onAction: (action: AIAction) => void;
}

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  onAction
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`ai-message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <UserAvatar /> : <AIAvatar />}
      </div>
      
      <div className="message-content">
        <div className="message-text">
          {message.content}
        </div>
        
        {/* AI消息的附加内容 */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="message-actions">
            {message.actions.map((action, index) => (
              <button
                key={index}
                className="action-button"
                onClick={() => onAction(action)}
              >
                {action.icon && <span className="action-icon">{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* 建议内容 */}
        {!isUser && message.suggestions && (
          <div className="message-suggestions">
            <h4>相关建议：</h4>
            {message.suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                {suggestion}
              </div>
            ))}
          </div>
        )}
        
        <div className="message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
\`\`\`

## 🔧 核心功能模块

### 1. AI服务集成
\`\`\`tsx
// services/ai-service.ts
export class AIService {
  private static instance: AIService;
  private contextManager: ContextManager;
  private preferenceManager: PreferenceManager;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async processMessage(request: AIProcessRequest): Promise<AIProcessResponse> {
    const context = await this.contextManager.getCurrentContext();
    const preferences = this.preferenceManager.getUserPreferences();

    // 构建提示词
    const prompt = this.buildPrompt(request.message, context, preferences);

    try {
      // 调用AI模型
      const response = await this.callAIModel(prompt);
      
      // 解析响应
      const parsedResponse = this.parseAIResponse(response);
      
      // 生成相关操作和建议
      const actions = this.generateActions(parsedResponse, context);
      const suggestions = this.generateSuggestions(parsedResponse, preferences);

      return {
        content: parsedResponse.content,
        actions,
        suggestions,
        contextUpdates: parsedResponse.contextUpdates
      };
    } catch (error) {
      throw new Error(`AI处理失败: ${error.message}`);
    }
  }

  private buildPrompt(
    message: string, 
    context: AppContext, 
    preferences: UserPreferences
  ): string {
    return `
      你是一个专业的AI助手，帮助用户使用YYC³平台的各种工具。
      
      当前上下文：
      - 用户所在页面: ${context.currentPage}
      - 用户行业: ${context.userIndustry}
      - 最近使用的工具: ${context.recentTools.join(', ')}
      
      用户偏好：
      - 常用功能: ${preferences.frequentlyUsed.join(', ')}
      - 技能水平: ${preferences.skillLevel}
      
      用户问题: ${message}
      
      请根据以上信息提供专业、有用的回答，可以：
      1. 解答具体问题
      2. 推荐相关工具
      3. 提供使用指导
      4. 建议工作流程
      
      回答要简洁明了，适合在浮窗中显示。
    `;
  }

  async generateToolRecommendations(context: AppContext): Promise<ToolRecommendation[]> {
    // 基于用户行为和上下文推荐工具
    const recommendations = await RecommendationEngine.generate(context);
    return recommendations.slice(0, 5); // 返回前5个推荐
  }

  async analyzeDataInsights(data: any): Promise<DataInsight[]> {
    // 数据分析洞察
    return DataAnalyzer.analyze(data);
  }
}
\`\`\`

### 2. 上下文管理器
\`\`\`tsx
// services/context-manager.ts
export class ContextManager {
  private currentContext: AppContext = {
    currentPage: '',
    userIndustry: '',
    recentTools: [],
    currentProject: null,
    userIntent: ''
  };

  async getCurrentContext(): Promise<AppContext> {
    // 从Redux store或URL获取当前上下文
    const state = store.getState();
    
    this.currentContext = {
      currentPage: state.router.location?.pathname || '',
      userIndustry: state.user.preferences?.industry || '',
      recentTools: state.user.history?.recentTools || [],
      currentProject: state.workspace.currentProject,
      userIntent: this.analyzeUserIntent()
    };

    return this.currentContext;
  }

  private analyzeUserIntent(): string {
    // 基于用户行为分析意图
    const recentActions = this.getRecentUserActions();
    return IntentAnalyzer.analyze(recentActions);
  }

  updateContext(updates: Partial<AppContext>): void {
    this.currentContext = { ...this.currentContext, ...updates };
  }
}
\`\`\`

## 🎨 样式系统

### 完整的CSS样式
\`\`\`css
/* intelligent-ai-widget.css */
.ai-widget-system {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 浮窗主体 */
.ai-widget-main {
  position: fixed;
  width: 380px;
  height: 600px;
  background: var(--ai-widget-bg);
  border-radius: 16px;
  box-shadow: var(--ai-widget-shadow);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.ai-widget-main.minimized {
  height: 60px;
  width: 300px;
}

.ai-widget-main.fullscreen {
  width: 90vw;
  height: 90vh;
  top: 5vh !important;
  left: 5vw !important;
}

/* 过渡动画 */
.ai-widget-transition-enter {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.ai-widget-transition-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-widget-transition-exit {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.ai-widget-transition-exit-active {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

/* 标题栏 */
.ai-widget-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ai-widget-primary), var(--ai-widget-secondary));
  color: white;
  cursor: move;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.ai-widget-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 内容区域 */
.ai-widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标签导航 */
.ai-tab-navigation {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ai-tab {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s;
}

.ai-tab.active {
  color: var(--ai-widget-primary);
  border-bottom: 2px solid var(--ai-widget-primary);
}

.ai-tab:hover:not(.active) {
  background: #f3f4f6;
}

/* 消息区域 */
.ai-messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #fafafa;
}

.ai-message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.ai-message-bubble.user {
  flex-direction: row-reverse;
}

.ai-message-bubble.user .message-content {
  background: var(--ai-widget-primary);
  color: white;
}

.ai-message-bubble.assistant .message-content {
  background: white;
  border: 1px solid #e5e7eb;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.action-button {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-button:hover {
  background: #f3f4f6;
  border-color: var(--ai-widget-primary);
}

.message-timestamp {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 输入区域 */
.ai-input-container {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

/* 通知徽章 */
.ai-notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: badge-pulse 2s infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-widget-main {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    top: 0 !important;
    left: 0 !important;
  }
  
  .ai-logo-trigger {
    bottom: 80px;
    right: 20px;
  }
}
\`\`\`

## 🔧 集成到主应用

### 1. 在根组件中集成
\`\`\`tsx
// App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { IntelligentAIWidget } from './components/intelligent-ai-widget/IntelligentAIWidget';
import { AIProvider } from './contexts/AIContext';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AIProvider>
          <div className="app">
            {/* 其他应用组件 */}
            <MainLayout />
            <Routes />
            
            {/* 智能AI浮窗 - 全局可访问 */}
            <IntelligentAIWidget />
          </div>
        </AIProvider>
      </BrowserRouter>
    </Provider>
  );
}
\`\`\`

### 2. AI上下文提供者
\`\`\`tsx
// contexts/AIContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AIState {
  isAvailable: boolean;
  conversationHistory: AIMessage[];
  toolRecommendations: ToolRecommendation[];
  userPreferences: UserPreferences;
}

const AIContext = createContext<{
  state: AIState;
  dispatch: React.Dispatch<AIAction>;
} | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  return (
    <AIContext.Provider value={{ state, dispatch }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
\`\`\`

## 🚀 功能特性总结

### 核心功能
1. **全局触发** - 通过Logo点击或Ctrl+K快捷键
2. **智能对话** - 基于上下文的AI对话
3. **工具推荐** - 智能推荐相关工具
4. **数据洞察** - 分析用户数据提供洞察
5. **工作流建议** - 推荐优化的工作流程

### 用户体验
1. **拖拽移动** - 可自由调整位置
2. **多模式显示** - 最小化/展开/全屏
3. **标签导航** - 快速切换不同功能
4. **动画效果** - 流畅的过渡动画
5. **响应式设计** - 适配不同屏幕尺寸

### 技术特点
1. **TypeScript支持** - 完整的类型定义
2. **状态管理** - 集成Redux状态管理
3. **服务分离** - 独立的AI服务层
4. **上下文感知** - 基于用户行为的智能推荐
5. **可扩展架构** - 易于添加新功能

智能AI浮窗设计提供了完整的用户交互体验，同时保持了技术架构的清晰和可维护性。
