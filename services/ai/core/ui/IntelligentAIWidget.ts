/**
 * @file 智能AI浮窗组件
 * @description 提供可拖拽、可调整大小的智能AI交互界面，集成多模块功能
 * @module ui/IntelligentAIWidget
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from '@/utils/EventEmitter';
import { ChatInterface } from './ChatInterface';
import { ToolboxPanel } from './ToolboxPanel';
import { InsightsDashboard } from './InsightsDashboard';
import { WorkflowDesigner } from './WorkflowDesigner';
import { UISystem } from './UISystem';
import { WidgetManager } from './widget/WidgetManager';
import { AdvancedDragSystem } from './widget/AdvancedDragSystem';
import { ResizeSystem } from './widget/ResizeSystem';
import { ThemeSystem } from './widget/ThemeSystem';
import { AnimationSystem } from './widget/AnimationSystem';

import {
  ChatMessage,
} from './types';

export interface WidgetConfig {
  id?: string;
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  minimized?: boolean;
  maximized?: boolean;
  theme?: WidgetTheme;
  animationEnabled?: boolean;
  enableDrag?: boolean;
  enableResize?: boolean;
  enablePersistence?: boolean;
  enableSync?: boolean;
  enableAccessibility?: boolean;
  enableSecurity?: boolean;
}

export interface WidgetState {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  maximized: boolean;
  theme: WidgetTheme;
  visible: boolean;
  zIndex: number;
  activeModule: string;
  modules: Record<string, any>;
  metadata: Record<string, any>;
}

export type WidgetTheme = 'light' | 'dark' | 'auto' | 'custom';

export interface WidgetMetrics {
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  errorCount: number;
  warningCount: number;
}

export interface WidgetPerformance {
  fps: number;
  loadTime: number;
  responseTime: number;
  throughput: number;
  concurrency: number;
}

export class IntelligentAIWidget extends EventEmitter {
  private widgetManager: WidgetManager;
  private dragSystem: AdvancedDragSystem;
  private resizeSystem: ResizeSystem;
  private themeSystem: ThemeSystem;
  private animationSystem: AnimationSystem;

  private chatInterface: ChatInterface;
  private toolPanel: ToolboxPanel;
  private workflowDesigner: WorkflowDesigner;
  private insightsDashboard: InsightsDashboard;

  private state: WidgetState;

  private uiSystem: UISystem;
  private config: WidgetConfig;
  private initialized: boolean;
  private metrics: WidgetMetrics;
  private performance: WidgetPerformance;

  constructor(config: WidgetConfig = {}) {
    super();

    this.config = {
      id: `widget-${Date.now()}`,
      title: 'YYC³ AI Assistant',
      width: 800,
      height: 600,
      x: 100,
      y: 100,
      minimized: false,
      maximized: false,
      theme: 'auto',
      animationEnabled: true,
      enableDrag: true,
      enableResize: true,
      enablePersistence: true,
      enableSync: true,
      enableAccessibility: true,
      enableSecurity: true,
      ...config,
    };

    this.state = {
      id: this.config.id!,
      title: this.config.title!,
      position: { x: this.config.x!, y: this.config.y! },
      size: { width: this.config.width!, height: this.config.height! },
      minimized: this.config.minimized!,
      maximized: this.config.maximized!,
      theme: this.config.theme!,
      visible: true,
      zIndex: 1000,
      activeModule: 'chat',
      modules: {},
      metadata: {},
    };

    this.widgetManager = new WidgetManager(this.state);
    this.dragSystem = new AdvancedDragSystem();
    this.resizeSystem = new ResizeSystem();
    this.themeSystem = new ThemeSystem({
      defaultTheme: this.config.theme!,
      enableAutoMode: this.config.theme === 'auto',
      enableTransitions: true,
      enablePersistence: true,
    });
    this.animationSystem = new AnimationSystem({
      enabled: this.config.animationEnabled!
    });

    this.uiSystem = new UISystem({
      enableChatInterface: true,
      enableToolboxPanel: true,
      enableInsightsDashboard: true,
      enableWorkflowDesigner: true,
      autoInitialize: false,
    });

    this.chatInterface = this.uiSystem.getChatInterface()!;
    this.toolPanel = this.uiSystem.getToolboxPanel()!;
    this.insightsDashboard = this.uiSystem.getInsightsDashboard()!;
    this.workflowDesigner = this.uiSystem.getWorkflowDesigner()!;

    this.initialized = false;
    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0,
      errorCount: 0,
      warningCount: 0,
    };
    this.performance = {
      fps: 60,
      loadTime: 0,
      responseTime: 0,
      throughput: 0,
      concurrency: 0,
    };

    this.initialize();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('IntelligentAIWidget already initialized');
      return;
    }

    try {
      this.emit('initializing');

      this.uiSystem.initialize();

      this.setupWidgetManager();
      this.setupDragSystem();
      this.setupResizeSystem();
      this.setupThemeSystem();
      this.setupAnimationSystem();

      this.initialized = true;
      this.emit('initialized');
      console.log('IntelligentAIWidget initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IntelligentAIWidget:', error);
      this.emit('initialization:error', error);
      throw error;
    }
  }

  private setupWidgetManager(): void {
    this.widgetManager.on('state:changed', (newState: WidgetState) => {
      this.state = newState;
      this.emit('state:changed', newState);
    });

    this.widgetManager.on('module:activated', (moduleId: string) => {
      this.state.activeModule = moduleId;
      this.emit('module:activated', moduleId);
    });

    this.widgetManager.on('module:deactivated', (moduleId: string) => {
      this.emit('module:deactivated', moduleId);
    });
  }

  private setupDragSystem(): void {
    if (!this.config.enableDrag) return;

    this.dragSystem.on('drag:start', (data) => {
      this.emit('drag:start', data);
    });

    this.dragSystem.on('drag:move', (data) => {
      this.state.position = { x: data.x, y: data.y };
      this.emit('drag:move', data);
    });

    this.dragSystem.on('drag:end', (data) => {
      this.emit('drag:end', data);
    });
  }

  private setupResizeSystem(): void {
    if (!this.config.enableResize) return;

    this.resizeSystem.on('resize:start', (data) => {
      this.emit('resize:start', data);
    });

    this.resizeSystem.on('resize:move', (data) => {
      this.state.size = { width: data.width, height: data.height };
      this.emit('resize:move', data);
    });

    this.resizeSystem.on('resize:end', (data) => {
      this.emit('resize:end', data);
    });
  }

  private setupThemeSystem(): void {
    this.themeSystem.on('theme:change', (data: any) => {
      this.state.theme = data.theme.mode as WidgetTheme;
      this.emit('theme:changed', data.theme);
    });

    this.themeSystem.on('auto:mode:change', (enabled: boolean) => {
      this.state.theme = enabled ? 'auto' : this.themeSystem.getCurrentTheme().mode as WidgetTheme;
      this.emit('auto:mode:changed', enabled);
    });
  }

  private setupAnimationSystem(): void {
    this.animationSystem.on('animation:started', (animationId: string) => {
      this.emit('animation:started', animationId);
    });

    this.animationSystem.on('animation:completed', (animationId: string) => {
      this.emit('animation:completed', animationId);
    });
  }

  async sendMessage(message: ChatMessage): Promise<string> {
    return this.chatInterface.sendMessage(message);
  }

  async executeTool(toolId: string, params: any): Promise<any> {
    return this.toolPanel.executeTool(toolId, params);
  }

  async executeWorkflow(workflowId: string): Promise<any> {
    const workflow = this.workflowDesigner.loadWorkflow(workflowId);
    return this.workflowDesigner.executeWorkflow(workflow);
  }

  show(): void {
    this.state.visible = true;
    this.emit('visibility:changed', { visible: true });
  }

  hide(): void {
    this.state.visible = false;
    this.emit('visibility:changed', { visible: false });
  }

  minimize(): void {
    this.state.minimized = true;
    this.emit('minimized');
  }

  maximize(): void {
    this.state.maximized = true;
    this.emit('maximized');
  }

  restore(): void {
    this.state.minimized = false;
    this.state.maximized = false;
    this.emit('restored');
  }

  setTheme(theme: WidgetTheme): void {
    this.themeSystem.setTheme(theme);
  }

  getTheme(): WidgetTheme {
    return this.themeSystem.getCurrentTheme().mode as WidgetTheme;
  }

  getState(): WidgetState {
    return { ...this.state };
  }

  getMetrics(): WidgetMetrics {
    return { ...this.metrics };
  }

  getPerformance(): WidgetPerformance {
    return { ...this.performance };
  }

  getChatInterface(): ChatInterface {
    return this.chatInterface;
  }

  getToolPanel(): ToolboxPanel {
    return this.toolPanel;
  }

  getInsightsDashboard(): InsightsDashboard {
    return this.insightsDashboard;
  }

  getWorkflowDesigner(): WorkflowDesigner {
    return this.workflowDesigner;
  }

  async exportData(): Promise<any> {
    return this.uiSystem.exportAllData();
  }

  async refresh(): Promise<void> {
    await this.uiSystem.refreshAll();
  }

  destroy(): void {
    this.emit('destroyed');

    this.widgetManager.destroy();
    this.dragSystem.destroy();
    this.resizeSystem.destroy();
    this.themeSystem.destroy();
    this.animationSystem.destroy();
    this.uiSystem.destroy();

    this.removeAllListeners();
    this.initialized = false;

    console.log('IntelligentAIWidget destroyed');
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
