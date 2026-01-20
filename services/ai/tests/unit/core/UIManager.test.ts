/**
 * @file UI管理器测试
 * @description 测试UI管理器的各项功能
 * @module __tests__/unit/core/UIManager.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-02
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from '../../../core/ui/UIManager';
import { ErrorHandler } from '../../../core/error-handler/ErrorHandler';
import { ValidationError, InternalError } from '../../../core/error-handler/ErrorTypes';
import type { Notification, Modal, UIEvent, UIEventHandler } from '../../../core/ui/types';

describe('UIManager', () => {
  let uiManager: UIManager;
  let mockErrorHandler: ErrorHandler;

  beforeEach(() => {
    mockErrorHandler = new ErrorHandler({ enableAutoRecovery: true });
    uiManager = new UIManager(mockErrorHandler);
  });

  afterEach(() => {
    uiManager.destroy();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该成功初始化UI管理器', () => {
      expect(uiManager).toBeDefined();
      expect(uiManager.isLoading()).toBe(false);
      expect(uiManager.getLoadingMessage()).toBeNull();
    });

    it('应该使用默认的错误处理器', () => {
      const defaultManager = new UIManager();
      expect(defaultManager).toBeDefined();
      defaultManager.destroy();
    });

    it('应该正确设置错误处理', () => {
      const errorSpy = vi.fn();
      uiManager.on('error', errorSpy);

      uiManager.emit('error', { error: new Error('Test error') });
      
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('事件处理', () => {
    it('应该成功注册事件处理器', () => {
      const handler: UIEventHandler = vi.fn();
      
      uiManager.registerEventHandler('test-event', handler);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('应该成功注销事件处理器', () => {
      const handler: UIEventHandler = vi.fn();
      
      uiManager.registerEventHandler('test-event', handler);
      uiManager.unregisterEventHandler('test-event', handler);
      
      const event: UIEvent = { type: 'test-event', data: {} };
      uiManager.emitEvent(event);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('应该成功发射事件', () => {
      const handler: UIEventHandler = vi.fn();
      const event: UIEvent = { type: 'test-event', data: { message: 'test' } };
      
      uiManager.registerEventHandler('test-event', handler);
      uiManager.emitEvent(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('应该支持多个事件处理器', () => {
      const handler1: UIEventHandler = vi.fn();
      const handler2: UIEventHandler = vi.fn();
      const event: UIEvent = { type: 'test-event', data: {} };
      
      uiManager.registerEventHandler('test-event', handler1);
      uiManager.registerEventHandler('test-event', handler2);
      uiManager.emitEvent(event);
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('应该在处理器出错时继续执行其他处理器', () => {
      const handler1: UIEventHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const handler2: UIEventHandler = vi.fn();
      const event: UIEvent = { type: 'test-event', data: {} };
      
      uiManager.registerEventHandler('test-event', handler1);
      uiManager.registerEventHandler('test-event', handler2);
      uiManager.emitEvent(event);
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('应该抛出ValidationError当事件类型为空', () => {
      const handler: UIEventHandler = vi.fn();
      
      expect(() => {
        uiManager.registerEventHandler('', handler);
      }).toThrow(ValidationError);
    });

    it('应该抛出ValidationError当处理器不是函数', () => {
      expect(() => {
        uiManager.registerEventHandler('test-event', null as any);
      }).toThrow(ValidationError);
    });

    it('应该抛出ValidationError当事件没有类型', () => {
      expect(() => {
        uiManager.emitEvent({} as UIEvent);
      }).toThrow(ValidationError);
    });

    it('应该发射handler:registered事件', () => {
      const spy = vi.fn();
      const handler: UIEventHandler = vi.fn();
      
      uiManager.on('handler:registered', spy);
      uiManager.registerEventHandler('test-event', handler);
      
      expect(spy).toHaveBeenCalledWith({
        eventType: 'test-event',
        handler
      });
    });

    it('应该发射handler:unregistered事件', () => {
      const spy = vi.fn();
      const handler: UIEventHandler = vi.fn();
      
      uiManager.registerEventHandler('test-event', handler);
      uiManager.on('handler:unregistered', spy);
      uiManager.unregisterEventHandler('test-event', handler);
      
      expect(spy).toHaveBeenCalledWith({
        eventType: 'test-event',
        handler
      });
    });

    it('应该发射event:emitted事件', () => {
      const spy = vi.fn();
      const event: UIEvent = { type: 'test-event', data: {} };
      
      uiManager.on('event:emitted', spy);
      uiManager.emitEvent(event);
      
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  describe('通知管理', () => {
    it('应该成功显示通知', () => {
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '测试消息',
      };
      
      uiManager.showNotification(notification);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toEqual(notification);
    });

    it('应该自动生成通知ID', () => {
      const notification: Notification = {
        type: 'success',
        title: '测试',
        message: '测试消息',
      };
      
      uiManager.showNotification(notification);
      const notifications = uiManager.getNotifications();
      
      expect(notifications[0].id).toBeDefined();
    });

    it('应该成功隐藏通知', () => {
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '测试消息',
      };
      
      uiManager.showNotification(notification);
      uiManager.hideNotification('test-notification');
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(0);
    });

    it('应该获取所有通知', () => {
      const notification1: Notification = {
        id: 'notification-1',
        type: 'success',
        title: '测试1',
        message: '消息1',
      };
      const notification2: Notification = {
        id: 'notification-2',
        type: 'error',
        title: '测试2',
        message: '消息2',
      };
      
      uiManager.showNotification(notification1);
      uiManager.showNotification(notification2);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(2);
    });

    it('应该清除所有通知', () => {
      const notification1: Notification = {
        id: 'notification-1',
        type: 'success',
        title: '测试1',
        message: '消息1',
      };
      const notification2: Notification = {
        id: 'notification-2',
        type: 'error',
        title: '测试2',
        message: '消息2',
      };
      
      uiManager.showNotification(notification1);
      uiManager.showNotification(notification2);
      uiManager.clearNotifications();
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(0);
    });

    it('应该自动隐藏通知', (done) => {
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '测试消息',
        duration: 100,
      };
      
      uiManager.showNotification(notification);
      expect(uiManager.getNotifications()).toHaveLength(1);
      
      setTimeout(() => {
        expect(uiManager.getNotifications()).toHaveLength(0);
        done();
      }, 150);
    });

    it('应该抛出ValidationError当通知没有消息', () => {
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '',
      };
      
      expect(() => {
        uiManager.showNotification(notification);
      }).toThrow(ValidationError);
    });

    it('应该发射notification:shown事件', () => {
      const spy = vi.fn();
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '测试消息',
      };
      
      uiManager.on('notification:shown', spy);
      uiManager.showNotification(notification);
      
      expect(spy).toHaveBeenCalledWith(notification);
    });

    it('应该发射notification:hidden事件', () => {
      const spy = vi.fn();
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '测试消息',
      };
      
      uiManager.showNotification(notification);
      uiManager.on('notification:hidden', spy);
      uiManager.hideNotification('test-notification');
      
      expect(spy).toHaveBeenCalledWith('test-notification');
    });

    it('应该发射notifications:cleared事件', () => {
      const spy = vi.fn();
      const notification: Notification = {
        id: 'test-notification',
        type: 'success',
        title: '测试',
        message: '测试消息',
      };
      
      uiManager.showNotification(notification);
      uiManager.on('notifications:cleared', spy);
      uiManager.clearNotifications();
      
      expect(spy).toHaveBeenCalledWith(['test-notification']);
    });
  });

  describe('模态框管理', () => {
    it('应该成功显示模态框', () => {
      const modal: Modal = {
        id: 'test-modal',
        title: '测试模态框',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal);
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(1);
      expect(modals[0]).toEqual(modal);
    });

    it('应该自动生成模态框ID', () => {
      const modal: Modal = {
        title: '测试模态框',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal);
      const modals = uiManager.getModals();
      
      expect(modals[0].id).toBeDefined();
    });

    it('应该成功关闭模态框', () => {
      const modal: Modal = {
        id: 'test-modal',
        title: '测试模态框',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal);
      uiManager.closeModal('test-modal');
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(0);
    });

    it('应该获取所有模态框', () => {
      const modal1: Modal = {
        id: 'modal-1',
        title: '模态框1',
        content: '内容1',
        size: 'small',
        closable: true,
        actions: [],
      };
      const modal2: Modal = {
        id: 'modal-2',
        title: '模态框2',
        content: '内容2',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal1);
      uiManager.showModal(modal2);
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(2);
    });

    it('应该清除所有模态框', () => {
      const modal1: Modal = {
        id: 'modal-1',
        title: '模态框1',
        content: '内容1',
        size: 'small',
        closable: true,
        actions: [],
      };
      const modal2: Modal = {
        id: 'modal-2',
        title: '模态框2',
        content: '内容2',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal1);
      uiManager.showModal(modal2);
      uiManager.clearModals();
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(0);
    });

    it('应该抛出ValidationError当模态框没有标题', () => {
      const modal: Modal = {
        id: 'test-modal',
        title: '',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      expect(() => {
        uiManager.showModal(modal);
      }).toThrow(ValidationError);
    });

    it('应该发射modal:shown事件', () => {
      const spy = vi.fn();
      const modal: Modal = {
        id: 'test-modal',
        title: '测试模态框',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.on('modal:shown', spy);
      uiManager.showModal(modal);
      
      expect(spy).toHaveBeenCalledWith(modal);
    });

    it('应该发射modal:hidden事件', () => {
      const spy = vi.fn();
      const modal: Modal = {
        id: 'test-modal',
        title: '测试模态框',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal);
      uiManager.on('modal:hidden', spy);
      uiManager.closeModal('test-modal');
      
      expect(spy).toHaveBeenCalledWith('test-modal');
    });

    it('应该发射modals:cleared事件', () => {
      const spy = vi.fn();
      const modal: Modal = {
        id: 'test-modal',
        title: '测试模态框',
        content: '测试内容',
        size: 'medium',
        closable: true,
        actions: [],
      };
      
      uiManager.showModal(modal);
      uiManager.on('modals:cleared', spy);
      uiManager.clearModals();
      
      expect(spy).toHaveBeenCalledWith(['test-modal']);
    });
  });

  describe('加载状态管理', () => {
    it('应该成功显示加载状态', () => {
      uiManager.showLoading('加载中...');
      
      expect(uiManager.isLoading()).toBe(true);
      expect(uiManager.getLoadingMessage()).toBe('加载中...');
    });

    it('应该使用默认消息', () => {
      uiManager.showLoading();
      
      expect(uiManager.getLoadingMessage()).toBe('加载中...');
    });

    it('应该成功隐藏加载状态', () => {
      uiManager.showLoading('加载中...');
      uiManager.hideLoading();
      
      expect(uiManager.isLoading()).toBe(false);
      expect(uiManager.getLoadingMessage()).toBeNull();
    });

    it('应该发射loading:shown事件', () => {
      const spy = vi.fn();
      
      uiManager.on('loading:shown', spy);
      uiManager.showLoading('加载中...');
      
      expect(spy).toHaveBeenCalledWith({ message: '加载中...' });
    });

    it('应该发射loading:hidden事件', () => {
      const spy = vi.fn();
      
      uiManager.showLoading('加载中...');
      uiManager.on('loading:hidden', spy);
      uiManager.hideLoading();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('便捷方法', () => {
    it('应该显示成功通知', () => {
      uiManager.showSuccess('操作成功', '成功', 1000);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].title).toBe('成功');
      expect(notifications[0].message).toBe('操作成功');
      expect(notifications[0].duration).toBe(1000);
    });

    it('应该显示错误通知', () => {
      uiManager.showError('操作失败', '错误', 2000);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].title).toBe('错误');
      expect(notifications[0].message).toBe('操作失败');
      expect(notifications[0].duration).toBe(2000);
    });

    it('应该显示警告通知', () => {
      uiManager.showWarning('请注意', '警告', 1500);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].title).toBe('警告');
      expect(notifications[0].message).toBe('请注意');
      expect(notifications[0].duration).toBe(1500);
    });

    it('应该显示信息通知', () => {
      uiManager.showInfo('提示信息', '提示', 1200);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].title).toBe('提示');
      expect(notifications[0].message).toBe('提示信息');
      expect(notifications[0].duration).toBe(1200);
    });

    it('应该显示确认对话框', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      uiManager.showConfirm('确认操作', '确定要执行此操作吗？', onConfirm, onCancel);
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(1);
      expect(modals[0].title).toBe('确认操作');
      expect(modals[0].content).toBe('确定要执行此操作吗？');
      expect(modals[0].actions).toHaveLength(2);
    });

    it('应该抛出ValidationError当确认对话框缺少标题或消息', () => {
      expect(() => {
        uiManager.showConfirm('', '消息', vi.fn());
      }).toThrow(ValidationError);
      
      expect(() => {
        uiManager.showConfirm('标题', '', vi.fn());
      }).toThrow(ValidationError);
    });

    it('应该抛出ValidationError当onConfirm不是函数', () => {
      expect(() => {
        uiManager.showConfirm('标题', '消息', null as any);
      }).toThrow(ValidationError);
    });

    it('应该显示输入对话框', () => {
      const onSubmit = vi.fn();
      
      uiManager.showPrompt('输入', '请输入内容', onSubmit, '默认值');
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(1);
      expect(modals[0].title).toBe('输入');
      expect(modals[0].content).toBe('请输入内容');
      expect(modals[0].actions).toHaveLength(2);
    });

    it('应该显示警告对话框', () => {
      const onClose = vi.fn();
      
      uiManager.showAlert('警告', '这是一个警告', onClose);
      const modals = uiManager.getModals();
      
      expect(modals).toHaveLength(1);
      expect(modals[0].title).toBe('警告');
      expect(modals[0].content).toBe('这是一个警告');
      expect(modals[0].size).toBe('small');
      expect(modals[0].actions).toHaveLength(1);
    });

    it('应该显示Toast通知', () => {
      uiManager.showToast('Toast消息', 'info', 1000);
      const notifications = uiManager.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toBe('Toast消息');
      expect(notifications[0].title).toBe('');
      expect(notifications[0].duration).toBe(1000);
    });

    it('应该使用默认Toast类型', () => {
      uiManager.showToast('Toast消息');
      const notifications = uiManager.getNotifications();
      
      expect(notifications[0].type).toBe('info');
    });
  });

  describe('错误处理', () => {
    it('应该在错误时显示通知', () => {
      const errorSpy = vi.fn();
      uiManager.on('error', errorSpy);
      
      uiManager.emit('error', { error: new Error('Test error') });
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在恢复时显示通知', () => {
      const recoverySpy = vi.fn();
      uiManager.on('recovery', recoverySpy);
      
      uiManager.emit('recovery', { error: new Error('Test error') });
      
      expect(recoverySpy).toHaveBeenCalled();
    });

    it('应该处理处理器错误', () => {
      const handler: UIEventHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const event: UIEvent = { type: 'test-event', data: {} };
      
      uiManager.registerEventHandler('test-event', handler);
      uiManager.emitEvent(event);
      
      expect(handler).toHaveBeenCalled();
    });

    it('应该发射handler:error事件', () => {
      const errorSpy = vi.fn();
      const handler: UIEventHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const event: UIEvent = { type: 'test-event', data: {} };
      
      uiManager.on('handler:error', errorSpy);
      uiManager.registerEventHandler('test-event', handler);
      uiManager.emitEvent(event);
      
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('销毁', () => {
    it('应该成功销毁UI管理器', () => {
      const handler: UIEventHandler = vi.fn();
      uiManager.registerEventHandler('test-event', handler);
      
      uiManager.destroy();
      
      expect(uiManager.getNotifications()).toHaveLength(0);
      expect(uiManager.getModals()).toHaveLength(0);
    });

    it('应该清除所有事件监听器', () => {
      const handler: UIEventHandler = vi.fn();
      uiManager.registerEventHandler('test-event', handler);
      
      uiManager.destroy();
      
      const event: UIEvent = { type: 'test-event', data: {} };
      uiManager.emitEvent(event);
      
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
