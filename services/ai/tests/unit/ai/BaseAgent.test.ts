/**
 * @file BaseAgent测试
 * @description 测试基础智能体抽象类的核心功能
 * @module __tests__/unit/ai/BaseAgent.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseAgent } from '@/ai/BaseAgent';
import {
  AgentConfig,
  AgentMessage,
  AgentCapability
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

    this.registerCommandHandler('error-command', async (params) => {
      throw new Error('Test error');
    });
  }

  protected async handleQuery(payload: any) {
    return {
      success: true,
      data: { queryResult: 'test' },
      timestamp: Date.now()
    };
  }

  getCapabilities() {
    return Array.from(this.capabilities.values());
  }
}

describe('BaseAgent', () => {
  let testAgent: TestAgent;
  let testConfig: AgentConfig;
  let mockPopup: any;

  beforeEach(() => {
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

    mockPopup = {
      id: 'popup-1',
      title: 'Test Popup',
      content: {},
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      visible: true,
      zIndex: 100
    };

    global.window = {
      innerWidth: 1024,
      innerHeight: 768
    } as any;

    global.navigator = {
      platform: 'MacIntel',
      language: 'zh-CN'
    } as any;

    testAgent = new TestAgent(testConfig);
  });

  afterEach(() => {
    testAgent.destroy();
  });

  describe('初始化', () => {
    it('应该正确初始化配置', () => {
      expect(testAgent.config).toBe(testConfig);
    });

    it('应该设置能力', () => {
      const capabilities = testAgent.getCapabilities();

      expect(capabilities).toHaveLength(1);
      expect(capabilities[0].id).toBe('test-capability');
    });

    it('应该设置命令处理器', () => {
      expect(testAgent['commandHandlers'].has('test-command')).toBe(true);
      expect(testAgent['commandHandlers'].has('error-command')).toBe(true);
    });
  });

  describe('绑定到弹窗', () => {
    it('应该成功绑定到弹窗', async () => {
      const boundSpy = vi.fn();

      testAgent.on('agent:bound', boundSpy);
      await testAgent.bindToPopup(mockPopup);

      expect(testAgent['popup']).toBe(mockPopup);
      expect(testAgent['context']).toBeDefined();
      expect(testAgent['context']?.popupId).toBe('popup-1');
      expect(boundSpy).toHaveBeenCalled();
    });

    it('应该正确设置上下文环境信息', async () => {
      await testAgent.bindToPopup(mockPopup);

      const context = testAgent['context'];

      expect(context?.environment.screenSize.width).toBe(1024);
      expect(context?.environment.screenSize.height).toBe(768);
      expect(context?.environment.deviceType).toBe('desktop');
      expect(context?.environment.platform).toBe('MacIntel');
      expect(context?.environment.language).toBe('zh-CN');
    });

    it('应该根据屏幕宽度识别设备类型', async () => {
      global.window.innerWidth = 500;
      const mobileAgent = new TestAgent(testConfig);
      await mobileAgent.bindToPopup(mockPopup);

      expect(mobileAgent['context']?.environment.deviceType).toBe('mobile');

      global.window.innerWidth = 800;
      const tabletAgent = new TestAgent(testConfig);
      await tabletAgent.bindToPopup(mockPopup);

      expect(tabletAgent['context']?.environment.deviceType).toBe('tablet');

      mobileAgent.destroy();
      tabletAgent.destroy();
    });
  });

  describe('处理消息', () => {
    beforeEach(async () => {
      await testAgent.bindToPopup(mockPopup);
    });

    it('应该成功处理命令消息', async () => {
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

      const response = await testAgent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'test-result', params: { test: 'value' } });
      expect(response.executionTime).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('应该处理不支持的命令', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'unsupported-command',
          parameters: {}
        }
      };

      const response = await testAgent.handleMessage(message);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('COMMAND_NOT_SUPPORTED');
    });

    it('应该处理命令执行错误', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'command',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'custom',
          action: 'error-command',
          parameters: {}
        }
      };

      const response = await testAgent.handleMessage(message);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('COMMAND_EXECUTION_FAILED');
    });

    it('应该处理查询消息', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'query',
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: { query: 'test' }
      };

      const response = await testAgent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ queryResult: 'test' });
    });

    it('应该处理不支持的消息类型', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        type: 'response' as any,
        from: 'system',
        to: 'test-agent-1',
        timestamp: Date.now(),
        payload: {}
      };

      const response = await testAgent.handleMessage(message);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('UNSUPPORTED_MESSAGE_TYPE');
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

      await testAgent.handleMessage(message);

      expect(testAgent['messageHistory']).toHaveLength(1);
      expect(testAgent['messageHistory'][0]).toBe(message);
    });

    it('应该限制消息历史大小', async () => {
      testAgent['maxHistorySize'] = 5;

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

        await testAgent.handleMessage(message);
      }

      expect(testAgent['messageHistory'].length).toBe(5);
    });

    it('应该发射消息处理事件', async () => {
      const processedSpy = vi.fn();

      testAgent.on('message:processed', processedSpy);

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

      await testAgent.handleMessage(message);

      expect(processedSpy).toHaveBeenCalledWith({
        messageId: 'msg-1',
        response: expect.any(Object),
        timestamp: expect.any(Number)
      });
    });
  });

  describe('能力管理', () => {
    it('应该添加能力', () => {
      const addedSpy = vi.fn();

      testAgent.on('capability:added', addedSpy);

      const capability: AgentCapability = {
        id: 'new-capability',
        name: 'New Capability',
        description: 'New capability',
        version: '1.0.0',
        enabled: true
      };

      testAgent['addCapability'](capability);

      expect(testAgent['capabilities'].has('new-capability')).toBe(true);
      expect(testAgent.config.capabilities).toContain(capability);
      expect(addedSpy).toHaveBeenCalled();
    });

    it('应该移除能力', () => {
      testAgent['addCapability']({
        id: 'test-capability',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        enabled: true
      });

      const removedSpy = vi.fn();
      testAgent.on('capability:removed', removedSpy);

      testAgent['removeCapability']('test-capability');

      expect(testAgent['capabilities'].has('test-capability')).toBe(false);
      expect(testAgent.config.capabilities.find(c => c.id === 'test-capability')).toBeUndefined();
      expect(removedSpy).toHaveBeenCalled();
    });

    it('移除不存在的能力应该不报错', () => {
      expect(() => {
        testAgent['removeCapability']('non-existent');
      }).not.toThrow();
    });
  });

  describe('命令处理器管理', () => {
    it('应该注册命令处理器', () => {
      const handler = async (params: any) => ({ result: 'test' });

      testAgent['registerCommandHandler']('new-command', handler);

      expect(testAgent['commandHandlers'].has('new-command')).toBe(true);
    });
  });

  describe('弹窗事件处理', () => {
    beforeEach(async () => {
      await testAgent.bindToPopup(mockPopup);
    });

    it('应该处理弹窗更新', () => {
      const updatedSpy = vi.fn();

      testAgent.on('popup:updated', updatedSpy);

      testAgent['handlePopupUpdate']({
        popupId: 'popup-1',
        popup: { title: 'Updated Title' },
        changes: ['title']
      });

      expect(testAgent['popup']?.title).toBe('Updated Title');
      expect(updatedSpy).toHaveBeenCalled();
    });

    it('应该忽略其他弹窗的更新', () => {
      const updatedSpy = vi.fn();

      testAgent.on('popup:updated', updatedSpy);

      testAgent['handlePopupUpdate']({
        popupId: 'popup-2',
        popup: { title: 'Updated Title' },
        changes: ['title']
      });

      expect(testAgent['popup']?.title).toBe('Test Popup');
      expect(updatedSpy).not.toHaveBeenCalled();
    });

    it('应该处理弹窗关闭', () => {
      const closedSpy = vi.fn();

      testAgent.on('popup:closed', closedSpy);

      testAgent['handlePopupClosed']({
        popupId: 'popup-1'
      });

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('跨智能体通信', () => {
    beforeEach(async () => {
      await testAgent.bindToPopup(mockPopup);
    });

    it('应该发送消息到其他智能体', async () => {
      const mockAgentManager = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          data: { result: 'ok' },
          timestamp: Date.now()
        })
      };

      (global as any).window.agentManager = mockAgentManager;

      const response = await testAgent['sendMessageToAgent']('agent-2', 'command', { action: 'test' });

      expect(mockAgentManager.sendMessage).toHaveBeenCalled();
      expect(response.success).toBe(true);
    });

    it('AgentManager未初始化时应该抛出错误', async () => {
      (global as any).window.agentManager = undefined;

      await expect(
        testAgent['sendMessageToAgent']('agent-2', 'command', { action: 'test' })
      ).rejects.toThrow();
    });

    it('应该广播消息', async () => {
      const mockAgentManager = {
        sendMessage: vi.fn().mockResolvedValue({
          success: true,
          data: { result: 'ok' },
          timestamp: Date.now()
        })
      };

      (global as any).window.agentManager = mockAgentManager;

      const response = await testAgent['broadcastMessage']('command', { action: 'test' });

      expect(mockAgentManager.sendMessage).toHaveBeenCalled();
      expect(response.success).toBe(true);
    });
  });

  describe('状态获取', () => {
    beforeEach(async () => {
      await testAgent.bindToPopup(mockPopup);
    });

    it('应该返回正确的状态', () => {
      const status = testAgent.getStatus();

      expect(status.agentId).toBe('test-agent-1');
      expect(status.popupId).toBe('popup-1');
      expect(status.capabilities).toHaveLength(1);
      expect(status.messageHistoryCount).toBe(0);
      expect(status.isBound).toBe(true);
      expect(status.context).toBeDefined();
      expect(status.config).toBe(testConfig);
    });

    it('未绑定时应该返回正确的状态', () => {
      const unboundAgent = new TestAgent(testConfig);
      const status = unboundAgent.getStatus();

      expect(status.agentId).toBe('test-agent-1');
      expect(status.popupId).toBe(null);
      expect(status.isBound).toBe(false);
      expect(status.context).toBe(null);

      unboundAgent.destroy();
    });
  });

  describe('销毁', () => {
    beforeEach(async () => {
      await testAgent.bindToPopup(mockPopup);
    });

    it('应该清理所有资源', () => {
      const destroyedSpy = vi.fn();

      testAgent.on('agent:destroyed', destroyedSpy);
      testAgent.destroy();

      expect(testAgent['messageHistory']).toHaveLength(0);
      expect(testAgent['commandHandlers'].size).toBe(0);
      expect(testAgent['capabilities'].size).toBe(0);
      expect(testAgent['popup']).toBe(null);
      expect(testAgent['context']).toBe(null);
      expect(destroyedSpy).toHaveBeenCalled();
    });

    it('应该移除所有事件监听器', () => {
      const testSpy = vi.fn();

      testAgent.on('test-event', testSpy);
      testAgent.destroy();

      testAgent.emit('test-event', {});

      expect(testSpy).not.toHaveBeenCalled();
    });
  });
});
