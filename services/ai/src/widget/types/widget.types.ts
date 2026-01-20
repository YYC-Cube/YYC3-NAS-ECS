/**
 * @file widget.types.ts - UI组件类型定义
 * @description YYC³ MovAISys 智能浮窗系统 - UI类型定义层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

/**
 * ================== 组件状态类型 ==================
 */

/**
 * 浮窗状态枚举
 */
export enum WidgetState {
  MINIMIZED = 'MINIMIZED',      // 最小化
  NORMAL = 'NORMAL',             // 正常显示
  MAXIMIZED = 'MAXIMIZED',       // 最大化
  DOCKED = 'DOCKED',             // 停靠（固定在屏幕边缘）
  FULLSCREEN = 'FULLSCREEN'       // 全屏
}

/**
 * 主题模式
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

/**
 * ================== 浮窗配置接口 ==================
 */

/**
 * 浮窗位置
 */
export interface WidgetPosition {
  x: number;
  y: number;
}

/**
 * 浮窗尺寸
 */
export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

/**
 * 浮窗配置
 */
export interface WidgetConfig {
  // 基础配置
  id: string;
  title: string;
  initialState: WidgetState;

  // 尺寸与位置
  size: WidgetSize;
  position: WidgetPosition;

  // 行为配置
  draggable: boolean;
  resizable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  closable: boolean;
  dockable: boolean;

  // 主题配置
  theme: ThemeMode;
  customTheme?: WidgetTheme;

  // 动画配置
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };

  // AI配置
  aiConfig: {
    provider: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
  };
}

/**
 * ================== 聊天相关类型 ==================
 */

/**
 * 消息来源
 */
export enum MessageSource {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
  TOOL = 'tool'
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  content: string;
  source: MessageSource;
  timestamp: Date;
  metadata?: {
    modelUsed?: string;
    tokensUsed?: number;
    latency?: number;
    toolCalls?: string[];
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  error?: string;
}

/**
 * 聊天会话
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  config: WidgetConfig;
}

/**
 * ================== UI事件类型 ==================
 */

/**
 * 拖拽事件
 */
export interface DragEvent {
  type: 'dragstart' | 'drag' | 'dragend';
  position: WidgetPosition;
  delta: { x: number; y: number };
}

/**
 * 调整大小事件
 */
export interface ResizeEvent {
  type: 'resizestart' | 'resize' | 'resizeend';
  size: WidgetSize;
  delta: { width: number; height: number };
}

/**
 * ================== 主题相关类型 ==================
 */

/**
 * 颜色配置
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

/**
 * 字体配置
 */
export interface FontConfig {
  family: string;
  size: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  weight: {
    normal: number;
    medium: number;
    bold: number;
  };
}

/**
 * 间距配置
 */
export interface SpacingConfig {
  unit: number;
  scale: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

/**
 * 阴影配置
 */
export interface ShadowConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * 圆角配置
 */
export interface RadiusConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * 主题配置
 */
export interface WidgetTheme {
  colors: ColorPalette;
  fonts: FontConfig;
  spacing: SpacingConfig;
  shadows: ShadowConfig;
  radius: RadiusConfig;
  transitions: {
    default: string;
    fast: string;
    slow: string;
  };
}

/**
 * ================== 工具类型 ==================
 */

/**
 * 工具栏按钮
 */
export interface ToolbarButton {
  id: string;
  icon: string;
  label?: string;
  tooltip?: string;
  action: () => void;
  disabled?: boolean;
  badge?: string | number;
}

/**
 * 快捷键
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}
