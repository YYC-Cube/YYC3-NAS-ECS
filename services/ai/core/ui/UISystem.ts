/**
 * @file UI系统集成管理器
 * @description 整合所有UI组件，提供统一的系统级接口
 * @module ui/UISystem
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import { ChatInterface } from './ChatInterface';
import { ToolboxPanel } from './ToolboxPanel';
import { InsightsDashboard } from './InsightsDashboard';
import { WorkflowDesigner } from './WorkflowDesigner';
import { UIManager } from './UIManager';
import {
  ChatMessage,
  Tool,
  MetricData,
  ChartData,
  Insight,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  Notification,
  Modal,
  UIEvent,
} from './types';

export interface UISystemConfig {
  enableChatInterface?: boolean;
  enableToolboxPanel?: boolean;
  enableInsightsDashboard?: boolean;
  enableWorkflowDesigner?: boolean;
  autoInitialize?: boolean;
}

export class UISystem extends EventEmitter {
  private chatInterface: ChatInterface | null;
  private toolboxPanel: ToolboxPanel | null;
  private insightsDashboard: InsightsDashboard | null;
  private workflowDesigner: WorkflowDesigner | null;
  private uiManager: UIManager;
  private config: UISystemConfig;
  private initialized: boolean;

  constructor(config: UISystemConfig = {}) {
    super();
    this.config = {
      enableChatInterface: true,
      enableToolboxPanel: true,
      enableInsightsDashboard: true,
      enableWorkflowDesigner: true,
      autoInitialize: true,
      ...config,
    };
    
    this.chatInterface = null;
    this.toolboxPanel = null;
    this.insightsDashboard = null;
    this.workflowDesigner = null;
    this.uiManager = new UIManager();
    this.initialized = false;

    if (this.config.autoInitialize) {
      this.initialize();
    }
  }

  initialize(): void {
    if (this.initialized) {
      console.warn('UISystem already initialized');
      return;
    }

    try {
      if (this.config.enableChatInterface) {
        this.chatInterface = new ChatInterface();
        this.setupChatInterfaceEvents();
      }

      if (this.config.enableToolboxPanel) {
        this.toolboxPanel = new ToolboxPanel();
        this.setupToolboxPanelEvents();
      }

      if (this.config.enableInsightsDashboard) {
        this.insightsDashboard = new InsightsDashboard();
        this.setupInsightsDashboardEvents();
      }

      if (this.config.enableWorkflowDesigner) {
        this.workflowDesigner = new WorkflowDesigner();
        this.setupWorkflowDesignerEvents();
      }

      this.setupUIManagerEvents();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log('UISystem initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UISystem:', error);
      throw error;
    }
  }

  private setupChatInterfaceEvents(): void {
    if (!this.chatInterface) return;

    this.chatInterface.on('message:sent', (message: ChatMessage) => {
      this.emit('chat:message:sent', message);
      this.uiManager.showInfo('消息已发送');
    });

    this.chatInterface.on('message:received', (message: ChatMessage) => {
      this.emit('chat:message:received', message);
    });

    this.chatInterface.on('session:created', (session) => {
      this.emit('chat:session:created', session);
      this.uiManager.showSuccess('会话已创建');
    });

    this.chatInterface.on('session:switched', (session) => {
      this.emit('chat:session:switched', session);
    });
  }

  private setupToolboxPanelEvents(): void {
    if (!this.toolboxPanel) return;

    this.toolboxPanel.on('tool:registered', (tool: Tool) => {
      this.emit('toolbox:tool:registered', tool);
    });

    this.toolboxPanel.on('tool:executed', (data) => {
      this.emit('toolbox:tool:executed', data);
      this.uiManager.showSuccess(`工具 ${data.toolId} 执行成功`);
    });

    this.toolboxPanel.on('tool:error', (data) => {
      this.emit('toolbox:tool:error', data);
      this.uiManager.showError(`工具 ${data.toolId} 执行失败: ${data.error.message}`);
    });
  }

  private setupInsightsDashboardEvents(): void {
    if (!this.insightsDashboard) return;

    this.insightsDashboard.on('refreshed', () => {
      this.emit('dashboard:refreshed');
    });

    this.insightsDashboard.on('insight:generated', (insight: Insight) => {
      this.emit('dashboard:insight:generated', insight);
    });
  }

  private setupWorkflowDesignerEvents(): void {
    if (!this.workflowDesigner) return;

    this.workflowDesigner.on('workflow:created', (workflow: Workflow) => {
      this.emit('workflow:created', workflow);
      this.uiManager.showSuccess(`工作流 ${workflow.name} 已创建`);
    });

    this.workflowDesigner.on('workflow:executed', (data) => {
      this.emit('workflow:executed', data);
      if (data.result.success) {
        this.uiManager.showSuccess('工作流执行成功');
      } else {
        this.uiManager.showError('工作流执行失败');
      }
    });

    this.workflowDesigner.on('workflow:error', (data) => {
      this.emit('workflow:error', data);
    });
  }

  private setupUIManagerEvents(): void {
    this.uiManager.on('notification:shown', (notification: Notification) => {
      this.emit('ui:notification:shown', notification);
    });

    this.uiManager.on('modal:shown', (modal: Modal) => {
      this.emit('ui:modal:shown', modal);
    });
  }

  getChatInterface(): ChatInterface | null {
    return this.chatInterface;
  }

  getToolboxPanel(): ToolboxPanel | null {
    return this.toolboxPanel;
  }

  getInsightsDashboard(): InsightsDashboard | null {
    return this.insightsDashboard;
  }

  getWorkflowDesigner(): WorkflowDesigner | null {
    return this.workflowDesigner;
  }

  getUIManager(): UIManager {
    return this.uiManager;
  }

  showAllComponents(): void {
    this.chatInterface?.show();
    this.toolboxPanel?.show();
    this.insightsDashboard?.show();
    this.workflowDesigner?.show();
    this.emit('components:visibility:changed', { visible: true });
  }

  hideAllComponents(): void {
    this.chatInterface?.hide();
    this.toolboxPanel?.hide();
    this.insightsDashboard?.hide();
    this.workflowDesigner?.hide();
    this.emit('components:visibility:changed', { visible: false });
  }

  async refreshAll(): Promise<void> {
    this.uiManager.showLoading('刷新所有组件...');
    
    try {
      const promises = [
        this.insightsDashboard?.refresh(),
      ];

      await Promise.all(promises.filter(Boolean));
      
      this.uiManager.hideLoading();
      this.uiManager.showSuccess('所有组件已刷新');
      this.emit('all:refreshed');
    } catch (error) {
      this.uiManager.hideLoading();
      this.uiManager.showError('刷新失败');
      throw error;
    }
  }

  async exportAllData(): Promise<any> {
    this.uiManager.showLoading('导出数据...');
    
    try {
      const data: any = {
        timestamp: Date.now(),
        chat: this.chatInterface ? {
          sessions: this.chatInterface.listSessions(),
          currentSession: this.chatInterface.getCurrentSession(),
        } : null,
        toolbox: this.toolboxPanel ? {
          tools: this.toolboxPanel.listTools(),
          categories: this.toolboxPanel.listCategories(),
        } : null,
        dashboard: this.insightsDashboard ? {
          metrics: this.insightsDashboard.getMetrics(),
          charts: this.insightsDashboard.getCharts(),
          insights: this.insightsDashboard.getInsights(),
        } : null,
        workflows: this.workflowDesigner ? {
          workflows: this.workflowDesigner.listWorkflows(),
          currentWorkflow: this.workflowDesigner.getCurrentWorkflow(),
        } : null,
      };

      this.uiManager.hideLoading();
      this.uiManager.showSuccess('数据导出成功');
      this.emit('data:exported', data);
      
      return data;
    } catch (error) {
      this.uiManager.hideLoading();
      this.uiManager.showError('数据导出失败');
      throw error;
    }
  }

  destroy(): void {
    this.emit('destroyed');
    
    this.chatInterface?.removeAllListeners();
    this.toolboxPanel?.removeAllListeners();
    this.insightsDashboard?.removeAllListeners();
    this.workflowDesigner?.removeAllListeners();
    this.uiManager.removeAllListeners();
    
    this.removeAllListeners();
    this.initialized = false;
    
    console.log('UISystem destroyed');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): UISystemConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<UISystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config:updated', this.config);
  }
}
