/**
 * @file ChatInterface 单元测试
 * @description 测试聊天界面组件的核心功能
 * @module __tests__/unit/ui/ChatInterface.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatInterface } from '@/ui/ChatInterface';
import { ChatMessage, ChatSession, ChatTheme, ChatLayout } from '@/ui/types';

describe('ChatInterface', () => {
  let chatInterface: ChatInterface;

  beforeEach(() => {
    chatInterface = new ChatInterface();
  });

  afterEach(() => {
    chatInterface.removeAllListeners();
  });

  describe('会话管理', () => {
    it('应该成功创建新会话', () => {
      const sessionId = chatInterface.createNewSession();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });

    it('应该使用模板创建新会话', () => {
      const template = {
        id: 'template-1',
        name: 'Test Template',
        description: 'A test template',
        systemPrompt: 'You are a helpful assistant',
        model: 'gpt-4'
      };
      const sessionId = chatInterface.createNewSession(template);
      expect(sessionId).toBeDefined();
      chatInterface.switchSession(sessionId);
      const session = chatInterface.getCurrentSession();
      expect(session?.template).toEqual(template);
    });

    it('应该获取当前会话', () => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
      const currentSession = chatInterface.getCurrentSession();
      expect(currentSession).toBeDefined();
      expect(currentSession?.id).toBe(sessionId);
    });

    it('应该切换会话', () => {
      const session1Id = chatInterface.createNewSession();
      const session2Id = chatInterface.createNewSession();
      chatInterface.switchSession(session2Id);
      const currentSession = chatInterface.getCurrentSession();
      expect(currentSession?.id).toBe(session2Id);
    });

    it('应该列出所有会话', () => {
      chatInterface.createNewSession();
      chatInterface.createNewSession();
      const sessions = chatInterface.listSessions();
      expect(sessions).toHaveLength(2);
    });

    it('应该重命名会话', () => {
      const sessionId = chatInterface.createNewSession();
      const session = chatInterface.sessions.get(sessionId);
      const oldName = session?.name || '';
      chatInterface.renameSession(sessionId, 'New Name');
      const renamedSession = chatInterface.sessions.get(sessionId);
      expect(renamedSession?.name).toBe('New Name');
    });
  });

  describe('消息发送', () => {
    beforeEach(() => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
    });

    it('应该成功发送消息', async () => {
      const response = await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello, AI!'
      });
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('应该自动生成消息ID', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello'
      };
      const response = await chatInterface.sendMessage(message);
      expect(message.id).toBeDefined();
    });

    it('应该自动设置时间戳', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello'
      };
      const beforeTime = Date.now();
      await chatInterface.sendMessage(message);
      const afterTime = Date.now();
      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('应该触发消息发送事件', async () => {
      const sendingSpy = vi.fn();
      const sentSpy = vi.fn();
      chatInterface.on('message:sending', sendingSpy);
      chatInterface.on('message:sent', sentSpy);

      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });

      expect(sendingSpy).toHaveBeenCalled();
      expect(sentSpy).toHaveBeenCalled();
    });

    it('应该处理发送错误', async () => {
      const errorSpy = vi.fn();
      chatInterface.on('message:error', errorSpy);

      vi.spyOn(chatInterface as any, 'processMessage').mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        chatInterface.sendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Hello'
        })
      ).rejects.toThrow('Network error');

      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该将消息添加到会话', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      const session = chatInterface.getCurrentSession();
      expect(session?.messages.length).toBeGreaterThan(0);
      const firstMessage = session?.messages[0];
      expect(firstMessage?.content).toBe('Hello');
    });
  });

  describe('消息历史', () => {
    beforeEach(() => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
    });

    it('应该获取消息历史', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      const history = chatInterface.getMessageHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该清空消息历史', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      await chatInterface.clearHistory();
      const history = chatInterface.getMessageHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('主题管理', () => {
    it('应该设置主题', () => {
      chatInterface.setTheme('dark');
      expect(chatInterface.getTheme()).toBe('dark');
    });

    it('应该支持自动主题', () => {
      chatInterface.setTheme('auto');
      expect(chatInterface.getTheme()).toBe('auto');
    });

    it('应该自定义主题配置', () => {
      const customConfig = {
        primaryColor: '#ff0000',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        messageBackgroundColor: '#333333',
        accentColor: '#00ff00'
      };
      chatInterface.setThemeConfig(customConfig);
      const config = chatInterface.getThemeConfig();
      expect(config.primaryColor).toBe('#ff0000');
    });

    it('应该触发主题变更事件', () => {
      const themeSpy = vi.fn();
      chatInterface.on('theme:changed', themeSpy);
      chatInterface.setTheme('dark');
      expect(themeSpy).toHaveBeenCalled();
    });
  });

  describe('布局管理', () => {
    it('应该设置布局', () => {
      chatInterface.setLayout('sidebar');
      expect(chatInterface.getLayout()).toBe('sidebar');
    });

    it('应该触发布局变更事件', () => {
      const layoutSpy = vi.fn();
      chatInterface.on('layout:changed', layoutSpy);
      chatInterface.setLayout('sidebar');
      expect(layoutSpy).toHaveBeenCalled();
    });
  });

  describe('可见性管理', () => {
    it('应该显示界面', () => {
      chatInterface.show();
      expect(chatInterface.visible).toBe(true);
    });

    it('应该隐藏界面', () => {
      chatInterface.hide();
      expect(chatInterface.visible).toBe(false);
    });

    it('应该最小化界面', () => {
      chatInterface.minimize();
      expect(chatInterface.minimized).toBe(true);
    });

    it('应该最大化界面', () => {
      chatInterface.minimize();
      chatInterface.maximize();
      expect(chatInterface.minimized).toBe(false);
    });
  });

  describe('建议回复', () => {
    beforeEach(() => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
    });

    it('应该获取建议回复', async () => {
      const context = {
        lastMessage: 'Hello',
        conversationSummary: 'A conversation',
        userIntent: 'greeting'
      };
      const suggestions = await chatInterface.suggestReplies(context);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('导出功能', () => {
    beforeEach(() => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
    });

    it('应该导出为JSON格式', async () => {
      const exported = await chatInterface.exportConversation('json');
      expect(exported).toBeDefined();
      expect(exported.format).toBe('json');
      expect(exported.content).toBeDefined();
    });

    it('应该导出为文本格式', async () => {
      const exported = await chatInterface.exportConversation('txt');
      expect(exported).toBeDefined();
      expect(exported.format).toBe('txt');
      expect(exported.content).toBeDefined();
    });

    it('应该导出为Markdown格式', async () => {
      const exported = await chatInterface.exportConversation('markdown');
      expect(exported).toBeDefined();
      expect(exported.format).toBe('markdown');
      expect(exported.content).toBeDefined();
    });
  });

  describe('附件支持', () => {
    it('应该支持添加附件', async () => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);

      const attachment: any = {
        id: 'att-1',
        type: 'image',
        name: 'test.png',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Check this image',
        attachments: [attachment]
      });

      const session = chatInterface.getCurrentSession();
      expect(session?.messages[0].attachments).toHaveLength(1);
    });
  });

  describe('输入状态', () => {
    it('应该启动输入指示器', () => {
      chatInterface.startTypingIndicator();
      expect(chatInterface.isTyping).toBe(true);
    });

    it('应该停止输入指示器', () => {
      chatInterface.startTypingIndicator();
      chatInterface.stopTypingIndicator();
      expect(chatInterface.isTyping).toBe(false);
    });

    it('应该触发输入状态事件', () => {
      const typingStartedSpy = vi.fn();
      const typingStoppedSpy = vi.fn();
      chatInterface.on('typing:started', typingStartedSpy);
      chatInterface.on('typing:stopped', typingStoppedSpy);
      chatInterface.startTypingIndicator();
      expect(typingStartedSpy).toHaveBeenCalled();
      chatInterface.stopTypingIndicator();
      expect(typingStoppedSpy).toHaveBeenCalled();
    });
  });

  describe('消息操作', () => {
    beforeEach(() => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
    });

    it('应该编辑消息', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      await chatInterface.editMessage('msg-1', 'Hello World');
      const session = chatInterface.getCurrentSession();
      expect(session?.messages[0].content).toBe('Hello World');
    });

    it('应该删除消息', async () => {
      const response = await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      const sessionBeforeDelete = chatInterface.getCurrentSession();
      const messageCountBefore = sessionBeforeDelete?.messages.length || 0;
      await chatInterface.deleteMessage('msg-1');
      const sessionAfterDelete = chatInterface.getCurrentSession();
      expect(sessionAfterDelete?.messages.length).toBe(messageCountBefore - 1);
    });

    it('应该标记消息为已读', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      chatInterface.markMessageAsRead('msg-1');
      const session = chatInterface.getCurrentSession();
      expect(session?.messages[0].status).toBe('read');
    });

    it('应该获取未读消息数量', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello'
      });
      const unreadCount = chatInterface.getUnreadCount();
      expect(unreadCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('翻译和摘要', () => {
    beforeEach(() => {
      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
    });

    it('应该翻译消息', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      const translated = await chatInterface.translateMessage('msg-1', '中文');
      expect(translated).toContain('翻译到中文');
    });

    it('应该生成对话摘要', async () => {
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });
      const summary = await chatInterface.summarizeConversation();
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
    });
  });

  describe('事件系统', () => {
    it('应该支持多个事件监听器', async () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      chatInterface.on('message:sent', spy1);
      chatInterface.on('message:sent', spy2);

      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('应该支持移除事件监听器', async () => {
      const spy = vi.fn();
      chatInterface.on('message:sent', spy);
      chatInterface.off('message:sent', spy);

      const sessionId = chatInterface.createNewSession();
      chatInterface.switchSession(sessionId);
      await chatInterface.sendMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello'
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
