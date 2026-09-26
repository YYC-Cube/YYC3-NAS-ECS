/**
 * @file useAIComponents - AI 浮窗状态管理 Hook
 * @description 提供 AI 智能助手浮窗的全局状态管理（单例 store 模式），
 *              包含浮窗显隐、位置尺寸、对话消息与会话管理。
 * @module lib/ai-components
 * @author YYC³
 * @version 1.1.0
 * @created 2026-09-26
 */

import { useSyncExternalStore } from 'react';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: WidgetPosition;
  size: WidgetSize;
  zIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messageIds: string[];
  createdAt: string;
}

interface AIStoreState {
  widget: WidgetState;
  isInitialized: boolean;
  messages: ChatMessage[];
  sessions: ChatSession[];
  activeSessionId: string | null;
}

type Listener = () => void;

const DEFAULT_SIZE: WidgetSize = { width: 420, height: 600 };
const DEFAULT_POSITION: WidgetPosition = { x: 0, y: 0 };

let state: AIStoreState = {
  widget: {
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { ...DEFAULT_POSITION },
    size: { ...DEFAULT_SIZE },
    zIndex: 9999,
  },
  isInitialized: false,
  messages: [],
  sessions: [],
  activeSessionId: null,
};

const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<AIStoreState>) {
  state = { ...state, ...partial };
  emitChange();
}

function setWidget(partial: Partial<WidgetState>) {
  state = { ...state, widget: { ...state.widget, ...partial } };
  emitChange();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAIWidget() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { widget } = snapshot;

  // 浮窗控制
  const showWidget = () => setWidget({ isOpen: true, isMinimized: false });
  const hideWidget = () => setWidget({ isOpen: false });
  const toggleWidget = () =>
    setWidget({ isOpen: !widget.isOpen, isMinimized: false });
  const minimizeWidget = () => setWidget({ isMinimized: true });
  const maximizeWidget = () => setWidget({ isMaximized: !widget.isMaximized });
  const updatePosition = (position: WidgetPosition) => setWidget({ position });
  const updateSize = (size: WidgetSize) => setWidget({ size });

  // 会话与消息
  const createSession = async (name: string) => {
    const session: ChatSession = {
      id: createId(),
      name,
      messageIds: [],
      createdAt: new Date().toISOString(),
    };
    setState({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    });
  };

  const switchSession = (id: string) => {
    setState({ activeSessionId: id });
  };

  const deleteSession = (id: string) => {
    const sessions = state.sessions.filter((s) => s.id !== id);
    const activeSessionId =
      state.activeSessionId === id
        ? sessions[0]?.id ?? null
        : state.activeSessionId;
    setState({ sessions, activeSessionId });
  };

  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    const messages = [...state.messages, userMessage];
    setState({ messages });

    // 模拟 AI 响应
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: `已收到您的消息："${content}"。这里是 AI 助手的模拟回复。`,
        timestamp: new Date().toISOString(),
      };
      setState({ messages: [...state.messages, aiMessage] });
    }, 600);
  };

  return {
    // 兼容命名
    isVisible: widget.isOpen,
    isInitialized: snapshot.isInitialized,
    widgetState: widget,
    // 浮窗操作
    showWidget,
    hideWidget,
    toggleWidget,
    minimizeWidget,
    maximizeWidget,
    updatePosition,
    updateSize,
    // 对话与会话
    messages: snapshot.messages,
    sessions: snapshot.sessions,
    activeSessionId: snapshot.activeSessionId,
    sendMessage,
    createSession,
    switchSession,
    deleteSession,
  };
}

export default useAIWidget;
