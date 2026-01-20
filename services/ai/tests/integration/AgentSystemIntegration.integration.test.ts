import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
}

interface AgentMessage {
  id: string;
  type: 'command' | 'notification' | 'response';
  from: string;
  to: string;
  timestamp: number;
  payload: any;
}

interface PopupInstance {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  content?: any;
}

class MockAgentSystem extends EventEmitter {
  private initialized = false;
  private config: any;

  constructor(config: any) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }

  createLayoutAgent(config: AgentConfig): any {
    const agent = new EventEmitter();
    agent.config = config;
    agent.bindToPopup = vi.fn();
    return agent;
  }

  createBehaviorAgent(config: AgentConfig): any {
    const agent = new EventEmitter();
    agent.config = config;
    agent.bindToPopup = vi.fn();
    return agent;
  }

  createContentAgent(config: AgentConfig): any {
    const agent = new EventEmitter();
    agent.config = config;
    agent.bindToPopup = vi.fn();
    return agent;
  }

  createAssistantAgent(config: AgentConfig): any {
    const agent = new EventEmitter();
    agent.config = config;
    agent.bindToPopup = vi.fn();
    return agent;
  }

  createMonitoringAgent(config: AgentConfig): any {
    const agent = new EventEmitter();
    agent.config = config;
    agent.bindToPopup = vi.fn();
    return agent;
  }

  queueMessage(message: AgentMessage, priority: number): void {
    this.emit('message:queued', { message, priority });
  }

  sendMessage(message: AgentMessage): void {
    this.emit('message:sent', message);
  }
}

class MockAutonomousAIEngine extends EventEmitter {
  private subsystems: Map<string, any> = new Map();

  registerSubsystem(id: string, subsystem: any): void {
    this.subsystems.set(id, subsystem);
    this.emit('subsystem:registered', { id, subsystem });
  }

  createTask(task: any): string {
    const taskId = `task-${Date.now()}`;
    this.emit('task:created', { taskId, task });
    return taskId;
  }

  completeTask(taskId: string, result: any): void {
    this.emit('task:completed', { taskId, result });
  }

  failTask(taskId: string, error: any): void {
    this.emit('task:failed', { taskId, error });
  }
}

class MockUISystem extends EventEmitter {
  sendChatMessage(message: string, context?: any): void {
    this.emit('chat:message:sent', { message, context });
  }

  executeTool(toolId: string, params: any): void {
    this.emit('tool:executed', { toolId, params });
  }

  executeWorkflow(workflowId: string, params: any): void {
    this.emit('workflow:executed', { workflowId, params });
  }

  createNotification(notification: any): void {
    this.emit('ui:notification:created', { notification });
  }
}

class AgentSystemIntegration extends EventEmitter {
  private agentSystem: MockAgentSystem;
  private engine: MockAutonomousAIEngine | null = null;
  private uiSystem: MockUISystem | null = null;
  private config: any;
  private popup: PopupInstance | null = null;
  private agents: Map<string, any> = new Map();
  private integrated = false;

  constructor(config: any = {}) {
    super();
    this.config = {
      enableAutoAgents: config.enableAutoAgents ?? true,
      enableLayoutAgent: config.enableLayoutAgent ?? true,
      enableBehaviorAgent: config.enableBehaviorAgent ?? true,
      enableContentAgent: config.enableContentAgent ?? true,
      enableAssistantAgent: config.enableAssistantAgent ?? true,
      enableMonitoringAgent: config.enableMonitoringAgent ?? true,
      agentManagerConfig: config.agentManagerConfig ?? {
        maxQueueSize: 1000,
        maxMessageHistory: 10000,
        enableMetrics: true,
        enableLogging: true,
        defaultTimeout: 30000
      }
    };

    this.agentSystem = new MockAgentSystem(this.config.agentManagerConfig);
  }

  async initialize(): Promise<void> {
    if (this.integrated) {
      console.warn('[AgentSystemIntegration] Already integrated');
      return;
    }

    await this.agentSystem.initialize();
    this.setupAgentSystemEvents();
    this.integrated = true;

    console.log('[AgentSystemIntegration] 智能体系统集成完成');
    this.emit('integrated');
  }

  async integrateWithEngine(engine: MockAutonomousAIEngine): Promise<void> {
    if (!this.integrated) {
      await this.initialize();
    }

    this.engine = engine;

    this.engine.on('task:created', (data) => {
      this.handleEngineTaskCreated(data);
    });

    this.engine.on('task:completed', (data) => {
      this.handleEngineTaskCompleted(data);
    });

    this.engine.on('task:failed', (data) => {
      this.handleEngineTaskFailed(data);
    });

    this.engine.on('subsystem:registered', (data) => {
      this.handleSubsystemRegistered(data);
    });

    console.log('[AgentSystemIntegration] 已与AutonomousAIEngine集成');
    this.emit('engine:integrated', { engine });
  }

  async integrateWithUISystem(uiSystem: MockUISystem): Promise<void> {
    if (!this.integrated) {
      await this.initialize();
    }

    this.uiSystem = uiSystem;

    this.uiSystem.on('chat:message:sent', (data) => {
      this.handleChatMessage(data);
    });

    this.uiSystem.on('tool:executed', (data) => {
      this.handleToolExecuted(data);
    });

    this.uiSystem.on('workflow:executed', (data) => {
      this.handleWorkflowExecuted(data);
    });

    this.uiSystem.on('ui:notification:created', (data) => {
      this.handleNotificationCreated(data);
    });

    console.log('[AgentSystemIntegration] 已与UISystem集成');
    this.emit('ui:integrated', { uiSystem });
  }

  async attachToPopup(popup: PopupInstance): Promise<void> {
    if (!this.integrated) {
      await this.initialize();
    }

    this.popup = popup;

    if (this.config.enableAutoAgents) {
      await this.createPopupAgents(popup);
    }

    console.log('[AgentSystemIntegration] 已附加到弹窗');
    this.emit('popup:attached', { popup });
  }

  private async createPopupAgents(popup: PopupInstance): Promise<void> {
    const popupId = popup.id;

    if (this.config.enableLayoutAgent) {
      const layoutAgent = this.agentSystem.createLayoutAgent({
        id: `layout-${popupId}`,
        name: `布局智能体-${popupId}`,
        description: '管理弹窗布局和位置',
        version: '1.0.0',
        enabled: true
      });

      layoutAgent.bindToPopup(popup);
      this.agents.set(`layout-${popupId}`, layoutAgent);

      this.setupLayoutAgentEvents(layoutAgent);
    }

    if (this.config.enableBehaviorAgent) {
      const behaviorAgent = this.agentSystem.createBehaviorAgent({
        id: `behavior-${popupId}`,
        name: `行为智能体-${popupId}`,
        description: '管理弹窗行为和交互',
        version: '1.0.0',
        enabled: true
      });

      behaviorAgent.bindToPopup(popup);
      this.agents.set(`behavior-${popupId}`, behaviorAgent);

      this.setupBehaviorAgentEvents(behaviorAgent);
    }

    if (this.config.enableContentAgent) {
      const contentAgent = this.agentSystem.createContentAgent({
        id: `content-${popupId}`,
        name: `内容智能体-${popupId}`,
        description: '管理弹窗内容和更新',
        version: '1.0.0',
        enabled: true
      });

      contentAgent.bindToPopup(popup);
      this.agents.set(`content-${popupId}`, contentAgent);

      this.setupContentAgentEvents(contentAgent);
    }

    if (this.config.enableAssistantAgent) {
      const assistantAgent = this.agentSystem.createAssistantAgent({
        id: `assistant-${popupId}`,
        name: `助手智能体-${popupId}`,
        description: '提供智能助手功能',
        version: '1.0.0',
        enabled: true
      });

      assistantAgent.bindToPopup(popup);
      this.agents.set(`assistant-${popupId}`, assistantAgent);

      this.setupAssistantAgentEvents(assistantAgent);
    }

    if (this.config.enableMonitoringAgent) {
      const monitoringAgent = this.agentSystem.createMonitoringAgent({
        id: `monitoring-${popupId}`,
        name: `监控智能体-${popupId}`,
        description: '监控弹窗性能和状态',
        version: '1.0.0',
        enabled: true
      });

      monitoringAgent.bindToPopup(popup);
      this.agents.set(`monitoring-${popupId}`, monitoringAgent);

      this.setupMonitoringAgentEvents(monitoringAgent);
    }
  }

  private setupLayoutAgentEvents(agent: any): void {
    agent.on('layout:moved', (data) => {
      this.emit('popup:layout:moved', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:layout:moved', data);
      }
    });

    agent.on('layout:resized', (data) => {
      this.emit('popup:layout:resized', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:layout:resized', data);
      }
    });

    agent.on('layout:minimized', (data) => {
      this.emit('popup:layout:minimized', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:layout:minimized', data);
      }
    });

    agent.on('layout:maximized', (data) => {
      this.emit('popup:layout:maximized', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:layout:maximized', data);
      }
    });
  }

  private setupBehaviorAgentEvents(agent: any): void {
    agent.on('behavior:changed', (data) => {
      this.emit('popup:behavior:changed', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:behavior:changed', data);
      }
    });

    agent.on('behavior:enabled', (data) => {
      this.emit('popup:behavior:enabled', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:behavior:enabled', data);
      }
    });

    agent.on('behavior:disabled', (data) => {
      this.emit('popup:behavior:disabled', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:behavior:disabled', data);
      }
    });
  }

  private setupContentAgentEvents(agent: any): void {
    agent.on('content:updated', (data) => {
      this.emit('popup:content:updated', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:content:updated', data);
      }
    });

    agent.on('content:reloaded', (data) => {
      this.emit('popup:content:reloaded', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:content:reloaded', data);
      }
    });

    agent.on('content:validated', (data) => {
      this.emit('popup:content:validated', data);
      if (this.uiSystem) {
        this.uiSystem.emit('popup:content:validated', data);
      }
    });
  }

  private setupAssistantAgentEvents(agent: any): void {
    agent.on('assistant:message:sent', (data) => {
      this.emit('assistant:message:sent', data);
      if (this.uiSystem) {
        this.uiSystem.emit('assistant:message:sent', data);
      }
    });

    agent.on('assistant:suggestion:generated', (data) => {
      this.emit('assistant:suggestion:generated', data);
      if (this.uiSystem) {
        this.uiSystem.emit('assistant:suggestion:generated', data);
      }
    });

    agent.on('assistant:context:updated', (data) => {
      this.emit('assistant:context:updated', data);
      if (this.uiSystem) {
        this.uiSystem.emit('assistant:context:updated', data);
      }
    });
  }

  private setupMonitoringAgentEvents(agent: any): void {
    agent.on('monitoring:metric-recorded', (data) => {
      this.emit('monitoring:metric-recorded', data);
      if (this.engine) {
        this.engine.emit('monitoring:metric-recorded', data);
      }
    });

    agent.on('monitoring:alert-triggered', (data) => {
      this.emit('monitoring:alert-triggered', data);
      if (this.uiSystem) {
        this.uiSystem.emit('monitoring:alert-triggered', data);
      }
    });

    agent.on('monitoring:report-generated', (data) => {
      this.emit('monitoring:report-generated', data);
      if (this.engine) {
        this.engine.emit('monitoring:report-generated', data);
      }
    });
  }

  private setupAgentSystemEvents(): void {
    this.agentSystem.on('agent:registered', (data) => {
      this.emit('agent:registered', data);
    });

    this.agentSystem.on('message:sent', (data) => {
      this.emit('agent:message:sent', data);
    });

    this.agentSystem.on('message:failed', (data) => {
      this.emit('agent:message:failed', data);
    });

    this.agentSystem.on('metrics:collected', (data) => {
      this.emit('agent:metrics:collected', data);
    });
  }

  private handleEngineTaskCreated(data: any): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      type: 'notification',
      from: 'engine',
      to: 'assistant',
      timestamp: Date.now(),
      payload: {
        event: 'task:created',
        data
      }
    };

    this.agentSystem.queueMessage(message, 1);
  }

  private handleEngineTaskCompleted(data: any): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      type: 'notification',
      from: 'engine',
      to: 'assistant',
      timestamp: Date.now(),
      payload: {
        event: 'task:completed',
        data
      }
    };

    this.agentSystem.queueMessage(message, 1);
  }

  private handleEngineTaskFailed(data: any): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      type: 'notification',
      from: 'engine',
      to: 'assistant',
      timestamp: Date.now(),
      payload: {
        event: 'task:failed',
        data
      }
    };

    this.agentSystem.queueMessage(message, 2);
  }

  private handleSubsystemRegistered(data: any): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      type: 'notification',
      from: 'engine',
      to: 'monitoring',
      timestamp: Date.now(),
      payload: {
        event: 'subsystem:registered',
        data
      }
    };

    this.agentSystem.queueMessage(message, 0);
  }

  private handleChatMessage(data: any): void {
    const assistantAgent = this.agents.get(`assistant-${this.popup?.id}`);
    
    if (assistantAgent) {
      const message: AgentMessage = {
        id: `msg-${Date.now()}`,
        type: 'command',
        from: 'ui',
        to: assistantAgent.config.id,
        timestamp: Date.now(),
        payload: {
          command: 'sendMessage',
          parameters: {
            message: data.message,
            context: data.context
          }
        }
      };

      this.agentSystem.sendMessage(message);
    }
  }

  private handleToolExecuted(data: any): void {
    const monitoringAgent = this.agents.get(`monitoring-${this.popup?.id}`);
    
    if (monitoringAgent) {
      const message: AgentMessage = {
        id: `msg-${Date.now()}`,
        type: 'command',
        from: 'ui',
        to: monitoringAgent.config.id,
        timestamp: Date.now(),
        payload: {
          command: 'recordMetric',
          parameters: {
            name: `tool-${data.toolId}`,
            value: data.executionTime || 0,
            unit: 'ms'
          }
        }
      };

      this.agentSystem.sendMessage(message);
    }
  }

  private handleWorkflowExecuted(data: any): void {
    const monitoringAgent = this.agents.get(`monitoring-${this.popup?.id}`);
    
    if (monitoringAgent) {
      const message: AgentMessage = {
        id: `msg-${Date.now()}`,
        type: 'command',
        from: 'ui',
        to: monitoringAgent.config.id,
        timestamp: Date.now(),
        payload: {
          command: 'recordMetric',
          parameters: {
            name: `workflow-${data.workflowId}`,
            value: data.executionTime || 0,
            unit: 'ms'
          }
        }
      };

      this.agentSystem.sendMessage(message);
    }
  }

  private handleNotificationCreated(data: any): void {
    const assistantAgent = this.agents.get(`assistant-${this.popup?.id}`);
    
    if (assistantAgent) {
      const message: AgentMessage = {
        id: `msg-${Date.now()}`,
        type: 'notification',
        from: 'ui',
        to: assistantAgent.config.id,
        timestamp: Date.now(),
        payload: {
          event: 'notification:created',
          data
        }
      };

      this.agentSystem.queueMessage(message, 0);
    }
  }

  getAgentSystem(): MockAgentSystem {
    return this.agentSystem;
  }

  getAgents(): Map<string, any> {
    return this.agents;
  }

  getAgent(agentId: string): any {
    return this.agents.get(agentId);
  }

  isIntegrated(): boolean {
    return this.integrated;
  }

  async shutdown(): Promise<void> {
    await this.agentSystem.shutdown();
    this.agents.clear();
    this.integrated = false;

    console.log('[AgentSystemIntegration] 智能体系统已关闭');
    this.emit('shutdown');
  }
}

describe('AgentSystemIntegration', () => {
  let integration: AgentSystemIntegration;
  let mockEngine: MockAutonomousAIEngine;
  let mockUISystem: MockUISystem;
  let mockPopup: PopupInstance;

  beforeEach(() => {
    integration = new AgentSystemIntegration();
    mockEngine = new MockAutonomousAIEngine();
    mockUISystem = new MockUISystem();
    mockPopup = { id: 'popup-1' };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该成功初始化集成系统', async () => {
      await integration.initialize();

      expect(integration.isIntegrated()).toBe(true);
    });

    it('应该防止重复初始化', async () => {
      await integration.initialize();
      await integration.initialize();

      expect(integration.isIntegrated()).toBe(true);
    });

    it('应该使用默认配置', () => {
      const defaultIntegration = new AgentSystemIntegration();

      expect(defaultIntegration).toBeDefined();
      expect(defaultIntegration).toBeInstanceOf(AgentSystemIntegration);
    });

    it('应该使用自定义配置', () => {
      const customConfig = {
        enableAutoAgents: false,
        enableLayoutAgent: false,
        agentManagerConfig: {
          maxQueueSize: 500
        }
      };

      const customIntegration = new AgentSystemIntegration(customConfig);

      expect(customIntegration).toBeDefined();
    });

    it('应该发出集成完成事件', async () => {
      const integratedSpy = vi.fn();

      integration.on('integrated', integratedSpy);
      await integration.initialize();

      expect(integratedSpy).toHaveBeenCalled();
    });
  });

  describe('与AutonomousAIEngine集成', () => {
    it('应该成功与引擎集成', async () => {
      await integration.integrateWithEngine(mockEngine);

      expect(integration.isIntegrated()).toBe(true);
    });

    it('应该监听引擎任务创建事件', async () => {
      const messageQueuedSpy = vi.fn();

      integration.getAgentSystem().on('message:queued', messageQueuedSpy);
      await integration.integrateWithEngine(mockEngine);

      mockEngine.createTask({ name: 'test-task' });

      expect(messageQueuedSpy).toHaveBeenCalled();
    });

    it('应该监听引擎任务完成事件', async () => {
      const messageQueuedSpy = vi.fn();

      integration.getAgentSystem().on('message:queued', messageQueuedSpy);
      await integration.integrateWithEngine(mockEngine);

      mockEngine.completeTask('task-1', { success: true });

      expect(messageQueuedSpy).toHaveBeenCalled();
    });

    it('应该监听引擎任务失败事件', async () => {
      const messageQueuedSpy = vi.fn();

      integration.getAgentSystem().on('message:queued', messageQueuedSpy);
      await integration.integrateWithEngine(mockEngine);

      mockEngine.failTask('task-1', { error: 'Test error' });

      expect(messageQueuedSpy).toHaveBeenCalled();
    });

    it('应该监听子系统注册事件', async () => {
      const messageQueuedSpy = vi.fn();

      integration.getAgentSystem().on('message:queued', messageQueuedSpy);
      await integration.integrateWithEngine(mockEngine);

      mockEngine.registerSubsystem('subsystem-1', {});

      expect(messageQueuedSpy).toHaveBeenCalled();
    });

    it('应该发出引擎集成完成事件', async () => {
      const engineIntegratedSpy = vi.fn();

      integration.on('engine:integrated', engineIntegratedSpy);
      await integration.integrateWithEngine(mockEngine);

      expect(engineIntegratedSpy).toHaveBeenCalledWith({ engine: mockEngine });
    });
  });

  describe('与UISystem集成', () => {
    it('应该成功与UI系统集成', async () => {
      await integration.integrateWithUISystem(mockUISystem);

      expect(integration.isIntegrated()).toBe(true);
    });

    it('应该监听聊天消息事件', async () => {
      const messageSentSpy = vi.fn();

      await integration.attachToPopup(mockPopup);
      integration.getAgentSystem().on('message:sent', messageSentSpy);
      await integration.integrateWithUISystem(mockUISystem);

      mockUISystem.sendChatMessage('Hello', { context: 'test' });

      expect(messageSentSpy).toHaveBeenCalled();
    });

    it('应该监听工具执行事件', async () => {
      const messageSentSpy = vi.fn();

      await integration.attachToPopup(mockPopup);
      integration.getAgentSystem().on('message:sent', messageSentSpy);
      await integration.integrateWithUISystem(mockUISystem);

      mockUISystem.executeTool('tool-1', { param: 'value' });

      expect(messageSentSpy).toHaveBeenCalled();
    });

    it('应该监听工作流执行事件', async () => {
      const messageSentSpy = vi.fn();

      await integration.attachToPopup(mockPopup);
      integration.getAgentSystem().on('message:sent', messageSentSpy);
      await integration.integrateWithUISystem(mockUISystem);

      mockUISystem.executeWorkflow('workflow-1', { param: 'value' });

      expect(messageSentSpy).toHaveBeenCalled();
    });

    it('应该监听通知创建事件', async () => {
      const messageQueuedSpy = vi.fn();

      await integration.attachToPopup(mockPopup);
      integration.getAgentSystem().on('message:queued', messageQueuedSpy);
      await integration.integrateWithUISystem(mockUISystem);

      mockUISystem.createNotification({ message: 'Test notification' });

      expect(messageQueuedSpy).toHaveBeenCalled();
    });

    it('应该发出UI集成完成事件', async () => {
      const uiIntegratedSpy = vi.fn();

      integration.on('ui:integrated', uiIntegratedSpy);
      await integration.integrateWithUISystem(mockUISystem);

      expect(uiIntegratedSpy).toHaveBeenCalledWith({ uiSystem: mockUISystem });
    });
  });

  describe('附加到弹窗', () => {
    it('应该成功附加到弹窗', async () => {
      await integration.attachToPopup(mockPopup);

      expect(integration.isIntegrated()).toBe(true);
    });

    it('应该创建布局智能体', async () => {
      await integration.attachToPopup(mockPopup);

      expect(integration.getAgent('layout-popup-1')).toBeDefined();
    });

    it('应该创建行为智能体', async () => {
      await integration.attachToPopup(mockPopup);

      expect(integration.getAgent('behavior-popup-1')).toBeDefined();
    });

    it('应该创建内容智能体', async () => {
      await integration.attachToPopup(mockPopup);

      expect(integration.getAgent('content-popup-1')).toBeDefined();
    });

    it('应该创建助手智能体', async () => {
      await integration.attachToPopup(mockPopup);

      expect(integration.getAgent('assistant-popup-1')).toBeDefined();
    });

    it('应该创建监控智能体', async () => {
      await integration.attachToPopup(mockPopup);

      expect(integration.getAgent('monitoring-popup-1')).toBeDefined();
    });

    it('应该将智能体绑定到弹窗', async () => {
      await integration.attachToPopup(mockPopup);

      const layoutAgent = integration.getAgent('layout-popup-1');
      expect(layoutAgent.bindToPopup).toHaveBeenCalledWith(mockPopup);
    });

    it('应该发出弹窗附加完成事件', async () => {
      const popupAttachedSpy = vi.fn();

      integration.on('popup:attached', popupAttachedSpy);
      await integration.attachToPopup(mockPopup);

      expect(popupAttachedSpy).toHaveBeenCalledWith({ popup: mockPopup });
    });

    it('应该支持禁用自动创建智能体', async () => {
      const noAutoAgentsIntegration = new AgentSystemIntegration({
        enableAutoAgents: false
      });

      await noAutoAgentsIntegration.attachToPopup(mockPopup);

      expect(noAutoAgentsIntegration.getAgents().size).toBe(0);
    });

    it('应该支持选择性创建智能体', async () => {
      const selectiveIntegration = new AgentSystemIntegration({
        enableLayoutAgent: true,
        enableBehaviorAgent: false,
        enableContentAgent: false,
        enableAssistantAgent: false,
        enableMonitoringAgent: false
      });

      await selectiveIntegration.attachToPopup(mockPopup);

      expect(selectiveIntegration.getAgent('layout-popup-1')).toBeDefined();
      expect(selectiveIntegration.getAgent('behavior-popup-1')).toBeUndefined();
      expect(selectiveIntegration.getAgent('content-popup-1')).toBeUndefined();
      expect(selectiveIntegration.getAgent('assistant-popup-1')).toBeUndefined();
      expect(selectiveIntegration.getAgent('monitoring-popup-1')).toBeUndefined();
    });
  });

  describe('智能体事件处理', () => {
    beforeEach(async () => {
      await integration.attachToPopup(mockPopup);
    });

    it('应该处理布局移动事件', () => {
      const layoutMovedSpy = vi.fn();
      const layoutAgent = integration.getAgent('layout-popup-1');

      integration.on('popup:layout:moved', layoutMovedSpy);
      layoutAgent.emit('layout:moved', { x: 100, y: 200 });

      expect(layoutMovedSpy).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('应该处理布局调整大小事件', () => {
      const layoutResizedSpy = vi.fn();
      const layoutAgent = integration.getAgent('layout-popup-1');

      integration.on('popup:layout:resized', layoutResizedSpy);
      layoutAgent.emit('layout:resized', { width: 800, height: 600 });

      expect(layoutResizedSpy).toHaveBeenCalledWith({ width: 800, height: 600 });
    });

    it('应该处理布局最小化事件', () => {
      const layoutMinimizedSpy = vi.fn();
      const layoutAgent = integration.getAgent('layout-popup-1');

      integration.on('popup:layout:minimized', layoutMinimizedSpy);
      layoutAgent.emit('layout:minimized', { minimized: true });

      expect(layoutMinimizedSpy).toHaveBeenCalledWith({ minimized: true });
    });

    it('应该处理布局最大化事件', () => {
      const layoutMaximizedSpy = vi.fn();
      const layoutAgent = integration.getAgent('layout-popup-1');

      integration.on('popup:layout:maximized', layoutMaximizedSpy);
      layoutAgent.emit('layout:maximized', { maximized: true });

      expect(layoutMaximizedSpy).toHaveBeenCalledWith({ maximized: true });
    });

    it('应该处理行为改变事件', () => {
      const behaviorChangedSpy = vi.fn();
      const behaviorAgent = integration.getAgent('behavior-popup-1');

      integration.on('popup:behavior:changed', behaviorChangedSpy);
      behaviorAgent.emit('behavior:changed', { behavior: 'new-behavior' });

      expect(behaviorChangedSpy).toHaveBeenCalledWith({ behavior: 'new-behavior' });
    });

    it('应该处理内容更新事件', () => {
      const contentUpdatedSpy = vi.fn();
      const contentAgent = integration.getAgent('content-popup-1');

      integration.on('popup:content:updated', contentUpdatedSpy);
      contentAgent.emit('content:updated', { content: 'new-content' });

      expect(contentUpdatedSpy).toHaveBeenCalledWith({ content: 'new-content' });
    });

    it('应该处理助手消息事件', () => {
      const assistantMessageSentSpy = vi.fn();
      const assistantAgent = integration.getAgent('assistant-popup-1');

      integration.on('assistant:message:sent', assistantMessageSentSpy);
      assistantAgent.emit('assistant:message:sent', { message: 'Hello' });

      expect(assistantMessageSentSpy).toHaveBeenCalledWith({ message: 'Hello' });
    });

    it('应该处理监控指标记录事件', () => {
      const metricRecordedSpy = vi.fn();
      const monitoringAgent = integration.getAgent('monitoring-popup-1');

      integration.on('monitoring:metric-recorded', metricRecordedSpy);
      monitoringAgent.emit('monitoring:metric-recorded', { metric: 'cpu', value: 80 });

      expect(metricRecordedSpy).toHaveBeenCalledWith({ metric: 'cpu', value: 80 });
    });
  });

  describe('跨系统集成事件', () => {
    beforeEach(async () => {
      await integration.integrateWithEngine(mockEngine);
      await integration.integrateWithUISystem(mockUISystem);
      await integration.attachToPopup(mockPopup);
    });

    it('应该将布局事件转发到UI系统', () => {
      const uiLayoutMovedSpy = vi.fn();
      const layoutAgent = integration.getAgent('layout-popup-1');

      mockUISystem.on('popup:layout:moved', uiLayoutMovedSpy);
      layoutAgent.emit('layout:moved', { x: 100, y: 200 });

      expect(uiLayoutMovedSpy).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('应该将监控事件转发到引擎', () => {
      const engineMetricRecordedSpy = vi.fn();
      const monitoringAgent = integration.getAgent('monitoring-popup-1');

      mockEngine.on('monitoring:metric-recorded', engineMetricRecordedSpy);
      monitoringAgent.emit('monitoring:metric-recorded', { metric: 'cpu', value: 80 });

      expect(engineMetricRecordedSpy).toHaveBeenCalledWith({ metric: 'cpu', value: 80 });
    });

    it('应该将助手事件转发到UI系统', () => {
      const uiAssistantMessageSpy = vi.fn();
      const assistantAgent = integration.getAgent('assistant-popup-1');

      mockUISystem.on('assistant:message:sent', uiAssistantMessageSpy);
      assistantAgent.emit('assistant:message:sent', { message: 'Hello' });

      expect(uiAssistantMessageSpy).toHaveBeenCalledWith({ message: 'Hello' });
    });
  });

  describe('智能体系统管理', () => {
    it('应该返回智能体系统', () => {
      const agentSystem = integration.getAgentSystem();

      expect(agentSystem).toBeDefined();
      expect(agentSystem).toBeInstanceOf(MockAgentSystem);
    });

    it('应该返回所有智能体', async () => {
      await integration.attachToPopup(mockPopup);

      const agents = integration.getAgents();

      expect(agents.size).toBe(5);
    });

    it('应该返回指定智能体', async () => {
      await integration.attachToPopup(mockPopup);

      const layoutAgent = integration.getAgent('layout-popup-1');

      expect(layoutAgent).toBeDefined();
      expect(layoutAgent.config.id).toBe('layout-popup-1');
    });

    it('应该检查集成状态', async () => {
      expect(integration.isIntegrated()).toBe(false);

      await integration.initialize();

      expect(integration.isIntegrated()).toBe(true);
    });
  });

  describe('关闭', () => {
    it('应该成功关闭集成系统', async () => {
      await integration.initialize();
      await integration.shutdown();

      expect(integration.isIntegrated()).toBe(false);
    });

    it('应该清除所有智能体', async () => {
      await integration.attachToPopup(mockPopup);
      await integration.shutdown();

      expect(integration.getAgents().size).toBe(0);
    });

    it('应该发出关闭事件', async () => {
      const shutdownSpy = vi.fn();

      integration.on('shutdown', shutdownSpy);
      await integration.initialize();
      await integration.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });

    it('应该关闭智能体系统', async () => {
      await integration.initialize();
      await integration.shutdown();

      const agentSystem = integration.getAgentSystem();
      expect(agentSystem).toBeDefined();
    });
  });

  describe('完整集成流程', () => {
    it('应该支持完整的集成流程', async () => {
      await integration.integrateWithEngine(mockEngine);
      await integration.integrateWithUISystem(mockUISystem);
      await integration.attachToPopup(mockPopup);

      expect(integration.isIntegrated()).toBe(true);
      expect(integration.getAgents().size).toBe(5);
    });

    it('应该处理跨系统消息流', async () => {
      await integration.integrateWithEngine(mockEngine);
      await integration.integrateWithUISystem(mockUISystem);
      await integration.attachToPopup(mockPopup);

      const messageSentSpy = vi.fn();
      integration.getAgentSystem().on('message:sent', messageSentSpy);

      mockUISystem.sendChatMessage('Hello', { context: 'test' });

      expect(messageSentSpy).toHaveBeenCalled();
    });

    it('应该支持多个弹窗', async () => {
      await integration.attachToPopup(mockPopup);

      const popup2 = { id: 'popup-2' };
      await integration.attachToPopup(popup2);

      expect(integration.getAgents().size).toBe(10);
    });
  });
});
