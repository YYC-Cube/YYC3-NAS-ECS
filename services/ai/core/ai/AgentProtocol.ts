/**
 * @file AgentProtocol.ts
 * @description 智能体通信协议 - 为每个弹窗绑定AI智能体
 * @module core/ai
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export type AgentStatusType = 'idle' | 'processing' | 'error' | 'busy' | 'offline';

export interface AgentMessage {
  id: string;
  type: 'command' | 'query' | 'response' | 'notification' | 'error';
  from: string;
  to: string;
  timestamp: number;
  payload: any;
  metadata?: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
    requiresResponse?: boolean;
    correlationId?: string;
  };
}

export interface AgentCommand {
  type: 'popup_control' | 'layout_control' | 'content_update' | 'behavior_change' | 'custom';
  action: string;
  parameters: Record<string, any>;
  constraints?: {
    timeout?: number;
    retryCount?: number;
    fallbackAction?: string;
  };
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime?: number;
  timestamp: number;
}

export interface AgentContext {
  popupId: string;
  userId?: string;
  sessionId: string;
  environment: {
    screenSize: { width: number; height: number };
    deviceType: 'mobile' | 'tablet' | 'desktop';
    platform: string;
    language: string;
  };
  preferences: Record<string, any>;
  history: AgentMessage[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  endpoint?: string;
  localModel?: boolean;
  modelConfig?: {
    provider: 'openai' | 'azure' | 'anthropic' | 'local' | 'custom';
    model: string;
    apiKey?: string;
    endpoint?: string;
  };
  policies: {
    maxConcurrentRequests: number;
    rateLimit: number;
    privacyLevel: 'high' | 'medium' | 'low';
    dataRetention: number;
  };
}

export interface AgentEvent {
  type: 'agent_created' | 'agent_updated' | 'agent_deleted' |
        'capability_added' | 'capability_removed' |
        'message_sent' | 'message_received' |
        'command_executed' | 'error_occurred';
  data: any;
  timestamp: number;
}

export interface AgentStats {
  totalMessages: number;
  successfulCommands: number;
  failedCommands: number;
  avgResponseTime: number;
  activeAgents: number;
  totalAgents: number;
  queueLength: number;
  isQueueProcessing: boolean;
}

export interface AgentStatistics {
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailed: number;
  averageProcessingTime: number;
  lastError: {
    code: string;
    message: string;
    timestamp: number;
  } | null;
  uptime: number;
}

export interface MessageRoute {
  target: string;
  routes: string[];
}

export interface AgentStatus {
  agentId: string;
  popupId: string | null;
  capabilities: AgentCapability[];
  messageHistoryCount: number;
  isBound: boolean;
  context: AgentContext | null;
  config: AgentConfig;
}

export interface AgentRoute {
  id: string;
  from: string;
  to: string;
  conditions?: {
    messageTypes?: AgentMessage['type'][];
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
  enabled: boolean;
}
