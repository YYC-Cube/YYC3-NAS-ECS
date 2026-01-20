/**
 * @file AgentManager测试
 * @description 测试智能体管理器的核心功能
 * @module __tests__/unit/ai/AgentManager.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentManager } from '@/ai/AgentManager';
import { BaseAgent } from '@/ai/BaseAgent';
import {
  AgentConfig,
  AgentMessage,
  AgentCapability,
  AgentRoute
} from '@/ai/AgentProtocol';

class TestAgent extends BaseAgent {
  protected setupCapabilities(): void {
    this.addCapability({
      id: 'test-capability',
      name: 'Test Capability',
      description: 'Test capability',
      version: '1.0.0',
      enabled: true
    });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('test-command', async (params) => {
      return { result: 'test-result', params };
    });
  }

  getCapabilities() {
    return Array.from(this.capabilities.values());
  }

  async shutdown(): Promise<void> {
    this.destroy();
  }
}

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let testAgent: TestAgent;
  let testConfig: AgentConfig;

  beforeEach(() => {
    agentManager = new AgentManager({
      maxQueueSize: 100,
      maxMessageHistory: 1000,
      enableMetrics: false,
      enableLogging: false
    });

    testConfig = {
      id: 'test-agent-1',
      name: 'Test Agent',
      description: 'Test agent for unit testing',
      capabilities: [],
      policies: {
        maxConcurrentRequests: 10,
        rateLimit: 100,
        privacyLevel: 'medium',
        dataRetention: 30
      }
    };

    testAgent = new TestAgent(testConfig);
  });

  afterEach(() => {
    agentManager.shutdown();
  });

  describe('注册和注销智能体', () => {
    it('应该成功注册智能体', () => {
      const agentId = agentManager.registerAgent(testAgent, testConfig);

      expect(agentId).toBe('test-agent-1');
      expect(agentManager.getRegisteredAgentCount()).toBe(1);
      expect(agentManager.getAgent('test-agent-1')).toBe(testAgent);
    });

    it('注册时应该自动生成ID', () => {
      const configWithoutId = { ...testConfig, id: '' as string };
      const agentId = agentManager.registerAgent(testAgent, configWithoutId);

      expect(agentId).toBeTruthy();
      expect(agentId.length).toBeGreaterThan(0);
    });

    it('不应该注册重复ID的智能体', () => {
      agentManager.registerAgent(testAgent, testConfig);

      expect(() => {
        agentManager.registerAgent(testAgent, testConfig);
      }).toThrow();
    });

    it('应该成功注销智能体', () => {
      agentManager.registerAgent(testAgent, testConfig);
      const result = agentManager.unregisterAgent('test-agent-1');

      expect(result).toBe(true);
      expect(agentManager.getRegisteredAgentCount()).toBe(0);
      expect(agentManager.getAgent('test-agent-1')).toBeUndefined();
    });

    it('注销不存在的智能体应该返回false', () => {
      const result = agentManager.unregisterAgent('non-existent');

      expect(result).toBe(false);
    });

    it('应该获取所有智能体', () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(testAgent, testConfig);
      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      const allAgents = agentManager.getAllAgents();

      expect(allAgents).toHaveLength(2);
      expect(allAgents).toContain(testAgent);
      expect(allAgents).toContain(agent2);
    });

    it('应该获取所有智能体ID', () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(testAgent, testConfig);
      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      const agentIds = agentManager.getAgentIds();

      expect(agentIds).toEqual(['test-agent-1', 'test-agent-2']);
    });
  });

  describe('发送消息', () => {
    beforeEach(() => {
      agentManager.registerAgent(testAgent, testConfig);
    });

    it('应该成功发送消息到智能体', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: { test: 'value' }
        }
      };

      const response = await agentManager.sendMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'test-result', params: { test: 'value' } });
    });

    it('发送到不存在的智能体应该返回错误', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'non-existent',
        timestamp: Date.now(),
        payload: {}
      };

      const response = await agentManager.sendMessage(message);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AGENT_NOT_FOUND');
    });

    it('应该广播消息到所有智能体', async () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      const message: Omit<AgentMessage, 'to'> = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: { test: 'value' }
        }
      };

      const responses = await agentManager.broadcastMessage(message);

      expect(responses).toHaveLength(2);
      expect(responses.every(r => r.success)).toBe(true);
    });

    it('应该更新智能体统计信息', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: {}
        }
      };

      await agentManager.sendMessage(message);

      const stats = agentManager.getAgentStatistics('test-agent-1');

      expect(stats?.messagesReceived).toBe(1);
      expect(stats?.messagesProcessed).toBe(1);
      expect(stats?.messagesFailed).toBe(0);
    });
  });

  describe('消息队列', () => {
    beforeEach(() => {
      agentManager.registerAgent(testAgent, testConfig);
    });

    it('应该将消息加入队列', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {}
      };

      agentManager.queueMessage(message, 1);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(agentManager.getQueueSize()).toBe(0);
    });

    it('应该按优先级排序消息', async () => {
      const message1: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {}
      };

      const message2: AgentMessage = {
        id: 'msg-2',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {}
      };

      agentManager.queueMessage(message1, 1);
      agentManager.queueMessage(message2, 2);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(agentManager.getQueueSize()).toBe(0);
    });

    it('队列满时应该触发事件', () => {
      const queueFullSpy = vi.fn();

      agentManager.on('queue:full', queueFullSpy);

      const maxQueueSize = agentManager['config'].maxQueueSize;

      const processQueueSpy = vi.spyOn(agentManager as any, 'processQueue').mockImplementation(() => Promise.resolve());

      for (let i = 0; i < maxQueueSize; i++) {
        const message: AgentMessage = {
          id: `msg-${i}`,
          type: 'command',
          from: 'system',
          to: 'test-agent-1',
          timestamp: Date.now(),
          payload: {}
        };

        agentManager.queueMessage(message, 0);
      }

      const overflowMessage: AgentMessage = {
        id: `msg-overflow`,
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {}
      };

      agentManager.queueMessage(overflowMessage, 0);

      expect(queueFullSpy).toHaveBeenCalled();
      expect(queueFullSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: overflowMessage
        })
      );

      processQueueSpy.mockRestore();
    });
  });

  describe('路由管理', () => {
    beforeEach(() => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(testAgent, testConfig);
      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });
    });

    it('应该添加路由', () => {
      const route: AgentRoute = {
        id: 'route-1',
        from: 'test-agent-1',
        to: 'test-agent-2',
        conditions: {
          messageTypes: ['command']
        }
      };

      agentManager.addRoute(route);

      expect(agentManager['routes'].get('test-agent-1')).toContainEqual(route);
    });

    it('应该移除路由', () => {
      const route: AgentRoute = {
        id: 'route-1',
        from: 'test-agent-1',
        to: 'test-agent-2',
        conditions: {
          messageTypes: ['command']
        }
      };

      agentManager.addRoute(route);
      agentManager.removeRoute('route-1');

      expect(agentManager['routes'].get('test-agent-1')).toHaveLength(0);
    });

    it('应该根据条件路由消息', async () => {
      const route: AgentRoute = {
        id: 'route-1',
        from: 'test-agent-1',
        to: 'test-agent-2',
        conditions: {
          messageTypes: ['command']
        }
      };

      agentManager.addRoute(route);

      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'test-agent-1',
        to: 'test-agent-2',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: {}
        }
      };

      const responses = await agentManager.routeMessage(message);

      expect(responses).toHaveLength(1);
      expect(responses[0].success).toBe(true);
    });
  });

  describe('能力管理', () => {
    beforeEach(() => {
      agentManager.registerAgent(testAgent, testConfig);
    });

    it('应该获取智能体的能力', () => {
      const capabilities = agentManager.getAgentCapabilities('test-agent-1');

      expect(capabilities).toHaveLength(1);
      expect(capabilities[0].id).toBe('test-capability');
    });

    it('应该获取所有智能体的能力', () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      const allCapabilities = agentManager.getAllCapabilities();

      expect(allCapabilities.size).toBe(2);
      expect(allCapabilities.get('test-agent-1')).toHaveLength(1);
      expect(allCapabilities.get('test-agent-2')).toHaveLength(1);
    });
  });

  describe('统计信息', () => {
    beforeEach(() => {
      agentManager.registerAgent(testAgent, testConfig);
    });

    it('应该获取智能体统计信息', () => {
      const stats = agentManager.getAgentStatistics('test-agent-1');

      expect(stats).toBeDefined();
      expect(stats?.messagesReceived).toBe(0);
      expect(stats?.messagesProcessed).toBe(0);
    });

    it('应该获取所有统计信息', () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      const allStats = agentManager.getAllStatistics();

      expect(allStats.size).toBe(2);
    });

    it('应该获取智能体状态', () => {
      const status = agentManager.getAgentStatus('test-agent-1');

      expect(status).toBe('idle');
    });

    it('应该获取所有状态', () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      const allStatuses = agentManager.getAllStatuses();

      expect(allStatuses.size).toBe(2);
    });
  });

  describe('消息历史', () => {
    beforeEach(() => {
      agentManager.registerAgent(testAgent, testConfig);
    });

    it('应该记录消息历史', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: {}
        }
      };

      await agentManager.sendMessage(message);

      const history = agentManager.getMessageHistory();

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('msg-1');
    });

    it('应该按智能体过滤消息历史', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: {}
        }
      };

      await agentManager.sendMessage(message);

      const history = agentManager.getMessageHistory('test-agent-1');

      expect(history).toHaveLength(1);
    });

    it('应该限制历史记录大小', async () => {
      const config = new AgentManager({
        maxMessageHistory: 5
      });

      config.registerAgent(testAgent, testConfig);

      for (let i = 0; i < 10; i++) {
        const message: AgentMessage = {
          id: `msg-${i}`,
          type: 'command',
          from: 'system',
          to: 'test-agent-1',
          timestamp: Date.now(),
          payload: {
            type: 'custom',
            action: 'test-command',
            parameters: {}
          }
        };

        await config.sendMessage(message);
      }

      const history = config.getMessageHistory();

      expect(history.length).toBeLessThanOrEqual(5);

      config.shutdown();
    });
  });

  describe('事件发射', () => {
    it('注册智能体时应该发射事件', () => {
      const registeredSpy = vi.fn();

      agentManager.on('agent:registered', registeredSpy);
      agentManager.registerAgent(testAgent, testConfig);

      expect(registeredSpy).toHaveBeenCalledWith({
        agentId: 'test-agent-1',
        config: testConfig,
        timestamp: expect.any(Number)
      });
    });

    it('注销智能体时应该发射事件', () => {
      const unregisteredSpy = vi.fn();

      agentManager.registerAgent(testAgent, testConfig);
      agentManager.on('agent:unregistered', unregisteredSpy);
      agentManager.unregisterAgent('test-agent-1');

      expect(unregisteredSpy).toHaveBeenCalledWith({
        agentId: 'test-agent-1',
        timestamp: expect.any(Number)
      });
    });

    it('发送消息时应该发射事件', async () => {
      const messageSentSpy = vi.fn();

      agentManager.registerAgent(testAgent, testConfig);
      agentManager.on('message:sent', messageSentSpy);

      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'test-command',
          parameters: {}
        }
      };

      await agentManager.sendMessage(message);

      expect(messageSentSpy).toHaveBeenCalled();
    });
  });

  describe('关闭', () => {
    it('应该关闭所有智能体', async () => {
      const agent2 = new TestAgent({
        ...testConfig,
        id: 'test-agent-2'
      });

      agentManager.registerAgent(testAgent, testConfig);
      agentManager.registerAgent(agent2, { ...testConfig, id: 'test-agent-2' });

      await agentManager.shutdown();

      expect(agentManager.getRegisteredAgentCount()).toBe(0);
    });

    it('应该清空队列和历史', async () => {
      agentManager.registerAgent(testAgent, testConfig);

      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {}
      };

      agentManager.queueMessage(message, 0);
      await agentManager.sendMessage(message);

      await agentManager.shutdown();

      expect(agentManager.getQueueSize()).toBe(0);
      expect(agentManager.getHistorySize()).toBe(0);
    });
  });
});
