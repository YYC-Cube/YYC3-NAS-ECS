/**
 * @file useWidgetStore.ts - Zustand状态管理
 * @description YYC³ MovAISys 智能浮窗系统 - 状态管理层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  WidgetState,
  WidgetPosition,
  WidgetSize,
  ChatMessage,
  ChatSession,
  ThemeMode
} from '../types/widget.types';

/**
 * 浮窗状态接口
 */
interface WidgetStoreState {
  // ================== 浮窗状态 ==================
  widgetState: WidgetState;
  position: WidgetPosition;
  size: WidgetSize;
  isVisible: boolean;
  isFocused: boolean;

  // ================== 聊天状态 ==================
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  isTyping: boolean;

  // ================== 主题状态 ==================
  theme: ThemeMode;
  customTheme: any;

  // ================== UI状态 ==================
  sidebarOpen: boolean;
  settingsOpen: boolean;
  toolbarVisible: boolean;

  // ================== 动作 ==================

  // 浮窗控制
  setWidgetState: (state: WidgetState) => void;
  setPosition: (position: WidgetPosition) => void;
  setSize: (size: WidgetSize) => void;
  toggleVisibility: () => void;
  showWidget: () => void;
  hideWidget: () => void;
  setFocus: (focused: boolean) => void;

  // 聊天控制
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsTyping: (typing: boolean) => void;
  createSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;

  // 主题控制
  setTheme: (theme: ThemeMode) => void;

  // UI控制
  toggleSidebar: () => void;
  toggleSettings: () => void;
  setToolbarVisible: (visible: boolean) => void;
}

/**
 * 浮窗状态管理
 *
 * 设计理念：
 * 1. 使用Zustand实现轻量级、高性能的状态管理
 * 2. 使用persist中间件实现状态持久化（localStorage）
 * 3. 使用devtools中间件实现开发调试
 * 4. 清晰的状态和动作分离
 * 5. 类型安全
 */
export const useWidgetStore = create<WidgetStoreState>()(
  devtools(
    persist(
      (set, _get) => ({
        // ================== 初始状态 ==================

        widgetState: WidgetState.NORMAL,
        position: { x: 100, y: 100 },
        size: {
          width: 400,
          height: 600,
          minWidth: 300,
          minHeight: 400
        },
        isVisible: true,
        isFocused: false,

        currentSession: null,
        sessions: [],
        messages: [],
        isTyping: false,

        theme: ThemeMode.AUTO,
        customTheme: null,

        sidebarOpen: false,
        settingsOpen: false,
        toolbarVisible: true,

        // ================== 动作实现 ==================

        // 浮窗控制
        setWidgetState: (state) => set({ widgetState: state }),

        setPosition: (position) => set({ position }),

        setSize: (size) => set({ size }),

        toggleVisibility: () => set((state) => ({
          isVisible: !state.isVisible
        })),

        showWidget: () => set({ isVisible: true }),

        hideWidget: () => set({ isVisible: false }),

        setFocus: (focused) => set({ isFocused: focused }),

        // 聊天控制
        addMessage: (message) => set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              status: 'sent'
            }
          ]
        })),

        updateMessage: (id, updates) => set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),

        clearMessages: () => set({ messages: [] }),

        setIsTyping: (typing) => set({ isTyping: typing }),

        createSession: () => set((state) => {
          const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: '新对话',
            messages: state.messages,
            createdAt: new Date(),
            updatedAt: new Date(),
            config: {} as any
          };

          return {
            sessions: [...state.sessions, newSession],
            currentSession: newSession,
            messages: []
          };
        }),

        switchSession: (sessionId) => set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (!session) return state;

          return {
            currentSession: session,
            messages: session.messages
          };
        }),

        deleteSession: (sessionId) => set((state) => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId
            ? null
            : state.currentSession
        })),

        // 主题控制
        setTheme: (theme) => set({ theme }),

        // UI控制
        toggleSidebar: () => set((state) => ({
          sidebarOpen: !state.sidebarOpen
        })),

        toggleSettings: () => set((state) => ({
          settingsOpen: !state.settingsOpen
        })),

        setToolbarVisible: (visible) => set({ toolbarVisible: visible })
      }),
      {
        name: 'yyc3-widget-storage',
        partialize: (state) => ({
          theme: state.theme,
          position: state.position,
          size: state.size
        })
      }
    ),
    {
      name: 'YYC3WidgetStore',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// ================== 选择器 ==================

/**
 * 浮窗状态选择器
 */
export const selectWidgetState = (state: WidgetStoreState) => state.widgetState;
export const selectPosition = (state: WidgetStoreState) => state.position;
export const selectSize = (state: WidgetStoreState) => state.size;
export const selectIsVisible = (state: WidgetStoreState) => state.isVisible;
export const selectIsFocused = (state: WidgetStoreState) => state.isFocused;

/**
 * 聊天状态选择器
 */
export const selectCurrentSession = (state: WidgetStoreState) => state.currentSession;
export const selectSessions = (state: WidgetStoreState) => state.sessions;
export const selectMessages = (state: WidgetStoreState) => state.messages;
export const selectIsTyping = (state: WidgetStoreState) => state.isTyping;

/**
 * 主题状态选择器
 */
export const selectTheme = (state: WidgetStoreState) => state.theme;
export const selectCustomTheme = (state: WidgetStoreState) => state.customTheme;

/**
 * UI状态选择器
 */
export const selectSidebarOpen = (state: WidgetStoreState) => state.sidebarOpen;
export const selectSettingsOpen = (state: WidgetStoreState) => state.settingsOpen;
export const selectToolbarVisible = (state: WidgetStoreState) => state.toolbarVisible;

// ================== 动作快捷方式 ==================

/**
 * 浮窗控制动作
 */
export const setWidgetState = (state: WidgetState) =>
  useWidgetStore.getState().setWidgetState(state);
export const setPosition = (position: WidgetPosition) =>
  useWidgetStore.getState().setPosition(position);
export const setSize = (size: WidgetSize) =>
  useWidgetStore.getState().setSize(size);
export const toggleVisibility = () =>
  useWidgetStore.getState().toggleVisibility();
export const showWidget = () =>
  useWidgetStore.getState().showWidget();
export const hideWidget = () =>
  useWidgetStore.getState().hideWidget();
export const setFocus = (focused: boolean) =>
  useWidgetStore.getState().setFocus(focused);

/**
 * 聊天控制动作
 */
export const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
  useWidgetStore.getState().addMessage(message);
export const updateMessage = (id: string, updates: Partial<ChatMessage>) =>
  useWidgetStore.getState().updateMessage(id, updates);
export const clearMessages = () =>
  useWidgetStore.getState().clearMessages();
export const setIsTyping = (typing: boolean) =>
  useWidgetStore.getState().setIsTyping(typing);
export const createSession = () =>
  useWidgetStore.getState().createSession();
export const switchSession = (sessionId: string) =>
  useWidgetStore.getState().switchSession(sessionId);
export const deleteSession = (sessionId: string) =>
  useWidgetStore.getState().deleteSession(sessionId);

/**
 * 主题控制动作
 */
export const setTheme = (theme: ThemeMode) =>
  useWidgetStore.getState().setTheme(theme);

/**
 * UI控制动作
 */
export const toggleSidebar = () =>
  useWidgetStore.getState().toggleSidebar();
export const toggleSettings = () =>
  useWidgetStore.getState().toggleSettings();
export const setToolbarVisible = (visible: boolean) =>
  useWidgetStore.getState().setToolbarVisible(visible);
