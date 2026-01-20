/**
 * @file 智能体系统集成模块
 * @description 将智能体系统集成到YYC³核心系统中，实现与AutonomousAIEngine和UISystem的协同工作
 * @module core/integration/AgentSystemIntegration
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';
import { AgentSystem } from '../ai/index';
import { AgentConfig, AgentMessage, AgentCapability } from '../ai/AgentProtocol';
import { AutonomousAIEngine } from '../pluggable/AutonomousAIEngine';
import { UISystem } from '../ui/UISystem';
import { PopupInstance } from '../pluggable/types';

export interface AgentSystemIntegrationConfig {
  enableAutoAgents?: boolean;
  enableLayoutAgent?: boolean;
  enableBehaviorAgent?: boolean;
  enableContentAgent?: boolean;
  enableAssistantAgent?: boolean;
  enableMonitoringAgent?: boolean;
  agentManagerConfig?: {
    maxQueueSize?: number;
    maxMessageHistory?: number;
    enableMetrics?: boolean;
    enableLogging?: boolean;
    defaultTimeout?: number;
  };
}

export class AgentSystemIntegration extends EventEmitter {
  private agentSystem: AgentSystem;
  private engine: AutonomousAIEngine | null = null;
  private uiSystem: UISystem | null = null;
  private config: Required<AgentSystemIntegrationConfig>;
  private popup: PopupInstance | null = null;
  private agents: Map<string, any> = new Map();
  private integrated = false;

  constructor(config: AgentSystemIntegrationConfig = {}) {
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

    this.agentSystem = new AgentSystem(this.config.agentManagerConfig);
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

  async integrateWithEngine(engine: AutonomousAIEngine): Promise<void> {
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

  async integrateWithUISystem(uiSystem: UISystem): Promise<void> {
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

  getAgentSystem(): AgentSystem {
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

export default AgentSystemIntegration;
