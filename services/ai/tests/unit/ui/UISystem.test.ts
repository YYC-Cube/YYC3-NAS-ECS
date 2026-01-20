/**
 * @file UISystem测试
 * @description 测试UI系统集成管理器的各项功能
 * @module __tests__/unit/ui/UISystem.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UISystem } from '@/ui/UISystem';
import { ChatInterface } from '@/ui/ChatInterface';
import { ToolboxPanel } from '@/ui/ToolboxPanel';
import { InsightsDashboard } from '@/ui/InsightsDashboard';
import { WorkflowDesigner } from '@/ui/WorkflowDesigner';
import { UIManager } from '@/ui/UIManager';

class MockEventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  public show: any;
  public hide: any;
  public refresh: any;
  public exportData: any;

  constructor() {
    this.show = vi.fn();
    this.hide = vi.fn();
    this.refresh = vi.fn();
    this.exportData = vi.fn();
  }

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

vi.mock('@/ui/ChatInterface', () => {
  return {
    ChatInterface: vi.fn().mockImplementation(() => new MockEventEmitter()),
  };
});

vi.mock('@/ui/ToolboxPanel', () => {
  return {
    ToolboxPanel: vi.fn().mockImplementation(() => new MockEventEmitter()),
  };
});

vi.mock('@/ui/InsightsDashboard', () => {
  return {
    InsightsDashboard: vi.fn().mockImplementation(() => new MockEventEmitter()),
  };
});

vi.mock('@/ui/WorkflowDesigner', () => {
  return {
    WorkflowDesigner: vi.fn().mockImplementation(() => new MockEventEmitter()),
  };
});

vi.mock('@/ui/UIManager', () => {
  return {
    UIManager: vi.fn().mockImplementation(() => ({
      showInfo: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    })),
  };
});

describe('UISystem', () => {
  let uiSystem: UISystem;
  let mockUIManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    uiSystem = new UISystem({ autoInitialize: false });
    
    const uiManagerInstance = uiSystem.getUIManager();
    mockUIManager = {
      showInfo: uiManagerInstance.showInfo,
      showSuccess: uiManagerInstance.showSuccess,
      showError: uiManagerInstance.showError,
      showLoading: uiManagerInstance.showLoading,
      hideLoading: uiManagerInstance.hideLoading,
      on: uiManagerInstance.on,
      removeAllListeners: uiManagerInstance.removeAllListeners,
    };
  });

  describe('constructor', () => {
    it('应该使用默认配置创建UISystem实例', () => {
      const system = new UISystem({ autoInitialize: false });
      
      expect(system).toBeInstanceOf(UISystem);
      expect(system.getChatInterface()).toBeNull();
      expect(system.getToolboxPanel()).toBeNull();
      expect(system.getInsightsDashboard()).toBeNull();
      expect(system.getWorkflowDesigner()).toBeNull();
      
      system.destroy();
    });

    it('应该使用自定义配置创建UISystem实例', () => {
      const system = new UISystem({
        enableChatInterface: false,
        enableToolboxPanel: false,
        autoInitialize: false,
      });
      
      expect(system).toBeInstanceOf(UISystem);
      
      system.destroy();
    });

    it('应该在autoInitialize为true时自动初始化', () => {
      const system = new UISystem();
      
      expect(system.getChatInterface()).toBeInstanceOf(MockEventEmitter);
      expect(system.getToolboxPanel()).toBeInstanceOf(MockEventEmitter);
      expect(system.getInsightsDashboard()).toBeInstanceOf(MockEventEmitter);
      expect(system.getWorkflowDesigner()).toBeInstanceOf(MockEventEmitter);
      
      system.destroy();
    });
  });

  describe('initialize', () => {
    it('应该成功初始化所有组件', () => {
      uiSystem.initialize();
      
      expect(uiSystem.getChatInterface()).toBeInstanceOf(MockEventEmitter);
      expect(uiSystem.getToolboxPanel()).toBeInstanceOf(MockEventEmitter);
      expect(uiSystem.getInsightsDashboard()).toBeInstanceOf(MockEventEmitter);
      expect(uiSystem.getWorkflowDesigner()).toBeInstanceOf(MockEventEmitter);
    });

    it('应该在已初始化时发出警告', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      uiSystem.initialize();
      uiSystem.initialize();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('UISystem already initialized');
      
      consoleWarnSpy.mockRestore();
    });

    it('应该发出initialized事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('initialized', eventSpy);
      
      uiSystem.initialize();
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该根据配置禁用特定组件', () => {
      const system = new UISystem({
        enableChatInterface: false,
        enableToolboxPanel: false,
        autoInitialize: false,
      });
      
      system.initialize();
      
      expect(system.getChatInterface()).toBeNull();
      expect(system.getToolboxPanel()).toBeNull();
      expect(system.getInsightsDashboard()).toBeInstanceOf(MockEventEmitter);
      expect(system.getWorkflowDesigner()).toBeInstanceOf(MockEventEmitter);
      
      system.destroy();
    });
  });

  describe('事件处理', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该转发chat:message:sent事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('chat:message:sent', eventSpy);
      
      const mockMessage = { id: '1', content: 'test', role: 'user' };
      (uiSystem.getChatInterface() as any).emit('message:sent', mockMessage);
      
      expect(eventSpy).toHaveBeenCalledWith(mockMessage);
    });

    it('应该转发chat:message:received事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('chat:message:received', eventSpy);
      
      const mockMessage = { id: '1', content: 'test', role: 'assistant' };
      (uiSystem.getChatInterface() as any).emit('message:received', mockMessage);
      
      expect(eventSpy).toHaveBeenCalledWith(mockMessage);
    });

    it('应该转发toolbox:tool:registered事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('toolbox:tool:registered', eventSpy);
      
      const mockTool = { id: 'tool1', name: 'Test Tool' };
      (uiSystem.getToolboxPanel() as any).emit('tool:registered', mockTool);
      
      expect(eventSpy).toHaveBeenCalledWith(mockTool);
    });

    it('应该转发dashboard:insight:generated事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('dashboard:insight:generated', eventSpy);
      
      const mockInsight = { id: 'insight1', title: 'Test Insight' };
      (uiSystem.getInsightsDashboard() as any).emit('insight:generated', mockInsight);
      
      expect(eventSpy).toHaveBeenCalledWith(mockInsight);
    });

    it('应该转发workflow:created事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('workflow:created', eventSpy);
      
      const mockWorkflow = { id: 'wf1', name: 'Test Workflow' };
      (uiSystem.getWorkflowDesigner() as any).emit('workflow:created', mockWorkflow);
      
      expect(eventSpy).toHaveBeenCalledWith(mockWorkflow);
    });

    it('应该转发ui:notification:shown事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('ui:notification:shown', eventSpy);
      
      const mockNotification = { id: 'notif1', message: 'Test' };
      mockUIManager.on.mock.calls.forEach((call: any) => {
        if (call[0] === 'notification:shown') {
          call[1](mockNotification);
        }
      });
      
      expect(eventSpy).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('getter方法', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该返回ChatInterface实例', () => {
      const chatInterface = uiSystem.getChatInterface();
      
      expect(chatInterface).toBeInstanceOf(MockEventEmitter);
    });

    it('应该返回ToolboxPanel实例', () => {
      const toolboxPanel = uiSystem.getToolboxPanel();
      
      expect(toolboxPanel).toBeInstanceOf(MockEventEmitter);
    });

    it('应该返回InsightsDashboard实例', () => {
      const dashboard = uiSystem.getInsightsDashboard();
      
      expect(dashboard).toBeInstanceOf(MockEventEmitter);
    });

    it('应该返回WorkflowDesigner实例', () => {
      const designer = uiSystem.getWorkflowDesigner();
      
      expect(designer).toBeInstanceOf(MockEventEmitter);
    });

    it('应该返回UIManager实例', () => {
      const manager = uiSystem.getUIManager();
      
      expect(manager).toEqual(mockUIManager);
    });
  });

  describe('showAllComponents', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该显示所有组件', () => {
      const showSpy = vi.fn();
      (uiSystem.getChatInterface() as any).show = showSpy;
      (uiSystem.getToolboxPanel() as any).show = showSpy;
      (uiSystem.getInsightsDashboard() as any).show = showSpy;
      (uiSystem.getWorkflowDesigner() as any).show = showSpy;
      
      uiSystem.showAllComponents();
      
      expect(showSpy).toHaveBeenCalledTimes(4);
    });

    it('应该发出components:visibility:changed事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('components:visibility:changed', eventSpy);
      
      uiSystem.showAllComponents();
      
      expect(eventSpy).toHaveBeenCalledWith({ visible: true });
    });
  });

  describe('hideAllComponents', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该隐藏所有组件', () => {
      const hideSpy = vi.fn();
      (uiSystem.getChatInterface() as any).hide = hideSpy;
      (uiSystem.getToolboxPanel() as any).hide = hideSpy;
      (uiSystem.getInsightsDashboard() as any).hide = hideSpy;
      (uiSystem.getWorkflowDesigner() as any).hide = hideSpy;
      
      uiSystem.hideAllComponents();
      
      expect(hideSpy).toHaveBeenCalledTimes(4);
    });

    it('应该发出components:visibility:changed事件', () => {
      const eventSpy = vi.fn();
      uiSystem.on('components:visibility:changed', eventSpy);
      
      uiSystem.hideAllComponents();
      
      expect(eventSpy).toHaveBeenCalledWith({ visible: false });
    });
  });

  describe('refreshAll', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该成功刷新所有组件', async () => {
      const refreshSpy = vi.fn().mockResolvedValue(undefined);
      (uiSystem.getInsightsDashboard() as any).refresh = refreshSpy;
      
      await uiSystem.refreshAll();
      
      expect(refreshSpy).toHaveBeenCalled();
      expect(mockUIManager.showLoading).toHaveBeenCalledWith('刷新所有组件...');
      expect(mockUIManager.hideLoading).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith('所有组件已刷新');
    });

    it('应该发出all:refreshed事件', async () => {
      const eventSpy = vi.fn();
      uiSystem.on('all:refreshed', eventSpy);
      (uiSystem.getInsightsDashboard() as any).refresh = vi.fn().mockResolvedValue(undefined);
      
      await uiSystem.refreshAll();
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该处理刷新错误', async () => {
      const error = new Error('Refresh failed');
      (uiSystem.getInsightsDashboard() as any).refresh = vi.fn().mockRejectedValue(error);
      
      await expect(uiSystem.refreshAll()).rejects.toThrow(error);
      
      expect(mockUIManager.hideLoading).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith('刷新失败');
    });
  });

  describe('exportAllData', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该成功导出所有数据', async () => {
      const mockSessions = [{ id: 'session1' }];
      const mockCurrentSession = { id: 'session1' };
      const mockTools = [{ id: 'tool1' }];
      const mockCategories = ['category1'];
      const mockMetrics = [{ name: 'metric1' }];
      const mockCharts = [{ id: 'chart1' }];
      const mockInsights = [{ id: 'insight1' }];
      const mockWorkflows = [{ id: 'wf1' }];
      const mockCurrentWorkflow = { id: 'wf1' };

      (uiSystem.getChatInterface() as any).listSessions = vi.fn().mockReturnValue(mockSessions);
      (uiSystem.getChatInterface() as any).getCurrentSession = vi.fn().mockReturnValue(mockCurrentSession);
      (uiSystem.getToolboxPanel() as any).listTools = vi.fn().mockReturnValue(mockTools);
      (uiSystem.getToolboxPanel() as any).listCategories = vi.fn().mockReturnValue(mockCategories);
      (uiSystem.getInsightsDashboard() as any).getMetrics = vi.fn().mockReturnValue(mockMetrics);
      (uiSystem.getInsightsDashboard() as any).getCharts = vi.fn().mockReturnValue(mockCharts);
      (uiSystem.getInsightsDashboard() as any).getInsights = vi.fn().mockReturnValue(mockInsights);
      (uiSystem.getWorkflowDesigner() as any).listWorkflows = vi.fn().mockReturnValue(mockWorkflows);
      (uiSystem.getWorkflowDesigner() as any).getCurrentWorkflow = vi.fn().mockReturnValue(mockCurrentWorkflow);

      const data = await uiSystem.exportAllData();

      expect(data).toHaveProperty('timestamp');
      expect(data.chat).toEqual({
        sessions: mockSessions,
        currentSession: mockCurrentSession,
      });
      expect(data.toolbox).toEqual({
        tools: mockTools,
        categories: mockCategories,
      });
      expect(data.dashboard).toEqual({
        metrics: mockMetrics,
        charts: mockCharts,
        insights: mockInsights,
      });
      expect(data.workflows).toEqual({
        workflows: mockWorkflows,
        currentWorkflow: mockCurrentWorkflow,
      });
    });

    it('应该发出data:exported事件', async () => {
      const eventSpy = vi.fn();
      uiSystem.on('data:exported', eventSpy);
      (uiSystem.getChatInterface() as any).listSessions = vi.fn().mockReturnValue([]);
      (uiSystem.getChatInterface() as any).getCurrentSession = vi.fn().mockReturnValue(null);
      (uiSystem.getToolboxPanel() as any).listTools = vi.fn().mockReturnValue([]);
      (uiSystem.getToolboxPanel() as any).listCategories = vi.fn().mockReturnValue([]);
      (uiSystem.getInsightsDashboard() as any).getMetrics = vi.fn().mockReturnValue([]);
      (uiSystem.getInsightsDashboard() as any).getCharts = vi.fn().mockReturnValue([]);
      (uiSystem.getInsightsDashboard() as any).getInsights = vi.fn().mockReturnValue([]);
      (uiSystem.getWorkflowDesigner() as any).listWorkflows = vi.fn().mockReturnValue([]);
      (uiSystem.getWorkflowDesigner() as any).getCurrentWorkflow = vi.fn().mockReturnValue(null);

      await uiSystem.exportAllData();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该处理导出错误', async () => {
      const error = new Error('Export failed');
      (uiSystem.getChatInterface() as any).listSessions = vi.fn().mockImplementation(() => {
        throw error;
      });

      await expect(uiSystem.exportAllData()).rejects.toThrow(error);

      expect(mockUIManager.hideLoading).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith('数据导出失败');
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      uiSystem.initialize();
    });

    it('应该清理所有组件和事件监听器', () => {
      const removeAllListenersSpy = vi.fn();
      (uiSystem.getChatInterface() as any).removeAllListeners = removeAllListenersSpy;
      (uiSystem.getToolboxPanel() as any).removeAllListeners = removeAllListenersSpy;
      (uiSystem.getInsightsDashboard() as any).removeAllListeners = removeAllListenersSpy;
      (uiSystem.getWorkflowDesigner() as any).removeAllListeners = removeAllListenersSpy;

      uiSystem.destroy();

      expect(removeAllListenersSpy).toHaveBeenCalledTimes(4);
      expect(mockUIManager.removeAllListeners).toHaveBeenCalled();
    });

    it('应该发出destroyed事件', () => {
      uiSystem.initialize();
      
      const eventSpy = vi.fn();
      uiSystem.on('destroyed', eventSpy);

      uiSystem.destroy();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该重置initialized状态', () => {
      uiSystem.destroy();
      uiSystem.initialize();

      expect(uiSystem.getChatInterface()).toBeInstanceOf(MockEventEmitter);
    });
  });

  describe('错误处理', () => {
    it('应该在初始化失败时抛出错误', () => {
      (ChatInterface as any).mockImplementation(() => {
        throw new Error('Failed to create ChatInterface');
      });

      const system = new UISystem({ autoInitialize: false });

      expect(() => system.initialize()).toThrow('Failed to create ChatInterface');

      system.destroy();
    });
  });

  describe('配置验证', () => {
    it('应该正确处理部分禁用的配置', () => {
      const system = new UISystem({
        enableChatInterface: false,
        enableToolboxPanel: true,
        enableInsightsDashboard: false,
        enableWorkflowDesigner: true,
        autoInitialize: false,
      });

      system.initialize();

      expect(system.getChatInterface()).toBeNull();
      expect(system.getToolboxPanel()).toBeInstanceOf(MockEventEmitter);
      expect(system.getInsightsDashboard()).toBeNull();
      expect(system.getWorkflowDesigner()).toBeInstanceOf(MockEventEmitter);

      system.destroy();
    });

    it('应该正确处理全部禁用的配置', () => {
      const system = new UISystem({
        enableChatInterface: false,
        enableToolboxPanel: false,
        enableInsightsDashboard: false,
        enableWorkflowDesigner: false,
        autoInitialize: false,
      });

      system.initialize();

      expect(system.getChatInterface()).toBeNull();
      expect(system.getToolboxPanel()).toBeNull();
      expect(system.getInsightsDashboard()).toBeNull();
      expect(system.getWorkflowDesigner()).toBeNull();

      system.destroy();
    });
  });
});
