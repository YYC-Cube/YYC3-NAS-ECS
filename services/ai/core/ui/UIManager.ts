/**
 * @file UI管理器实现
 * @description 实现IUIManager接口，提供动态交互系统功能
 * @module ui/UIManager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  IUIManager,
  UIEvent,
  UIEventHandler,
  Notification,
  Modal,
} from './types';
import { ErrorHandler } from '../error-handler/ErrorHandler';
import { ErrorBoundary } from '../error-handler/ErrorBoundary';
import { ValidationError, InternalError } from '../error-handler/ErrorTypes';

export class UIManager extends EventEmitter implements IUIManager {
  private eventHandlers: Map<string, Set<UIEventHandler>>;
  private notifications: Map<string, Notification>;
  private modals: Map<string, Modal>;
  private loading: boolean;
  private loadingMessage: string | null;
  private errorHandler: ErrorHandler;
  private errorBoundary: ErrorBoundary;

  constructor(errorHandler?: ErrorHandler) {
    super();
    this.eventHandlers = new Map();
    this.notifications = new Map();
    this.modals = new Map();
    this.loading = false;
    this.loadingMessage = null;

    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
    this.errorBoundary = new ErrorBoundary(this.errorHandler, {
      enableRecovery: true,
      maxRetries: 3,
      retryDelay: 1000
    });

    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.errorBoundary.on('error', (errorInfo) => {
      this.emit('error', errorInfo);
      this.showError(errorInfo.error.message || 'UI操作发生错误', '系统错误');
    });

    this.errorBoundary.on('recovery', (recoveryInfo) => {
      this.emit('recovery', recoveryInfo);
      this.showInfo('系统已自动恢复', '恢复成功');
    });

    this.on('error', (errorInfo) => {
      console.error('[UIManager Error]', errorInfo);
    });
  }

  registerEventHandler(eventType: string, handler: UIEventHandler): void {
    if (!eventType) {
      throw new ValidationError('Event type cannot be empty', 'eventType');
    }

    if (!handler || typeof handler !== 'function') {
      throw new ValidationError('Event handler must be a function', 'handler');
    }

    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.add(handler);

    this.emit('handler:registered', { eventType, handler });
  }

  unregisterEventHandler(eventType: string, handler: UIEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }

      this.emit('handler:unregistered', { eventType, handler });
    }
  }

  emitEvent(event: UIEvent): void {
    if (!event || !event.type) {
      throw new ValidationError('Event must have a type', 'event');
    }

    this.emit('event:emitted', event);

    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          this.errorHandler.handleError(error as Error, {
            operation: 'emitEvent',
            eventType: event.type
          });
          this.emit('handler:error', { event, handler, error });
        }
      }
    }
  }

  showNotification(notification: Notification): void {
    if (!notification || !notification.message) {
      throw new ValidationError('Notification must have a message', 'notification');
    }

    if (!notification.id) {
      notification.id = this.generateId();
    }

    this.notifications.set(notification.id, notification);
    this.emit('notification:shown', notification);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification.id);
      }, notification.duration);
    }
  }

  hideNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      this.notifications.delete(notificationId);
      this.emit('notification:hidden', notificationId);
    }
  }

  getNotifications(): Notification[] {
    return Array.from(this.notifications.values());
  }

  clearNotifications(): void {
    const notificationIds = Array.from(this.notifications.keys());
    this.notifications.clear();
    this.emit('notifications:cleared', notificationIds);
  }

  showModal(modal: Modal): void {
    if (!modal || !modal.title) {
      throw new ValidationError('Modal must have a title', 'modal');
    }

    if (!modal.id) {
      modal.id = this.generateId();
    }

    this.modals.set(modal.id, modal);
    this.emit('modal:shown', modal);
  }

  closeModal(modalId: string): void {
    const modal = this.modals.get(modalId);
    if (modal) {
      this.modals.delete(modalId);
      this.emit('modal:hidden', modalId);
    }
  }

  getModals(): Modal[] {
    return Array.from(this.modals.values());
  }

  clearModals(): void {
    const modalIds = Array.from(this.modals.keys());
    this.modals.clear();
    this.emit('modals:cleared', modalIds);
  }

  showLoading(message?: string): void {
    this.loading = true;
    this.loadingMessage = message || '加载中...';
    this.emit('loading:shown', { message: this.loadingMessage });
  }

  hideLoading(): void {
    this.loading = false;
    this.loadingMessage = null;
    this.emit('loading:hidden');
  }

  isLoading(): boolean {
    return this.loading;
  }

  getLoadingMessage(): string | null {
    return this.loadingMessage;
  }

  showSuccess(message: string, title?: string, duration?: number): void {
    this.showNotification({
      id: this.generateId(),
      type: 'success',
      title: title || '成功',
      message,
      duration: duration || 3000,
    });
  }

  showError(message: string, title?: string, duration?: number): void {
    this.showNotification({
      id: this.generateId(),
      type: 'error',
      title: title || '错误',
      message,
      duration: duration || 5000,
    });
  }

  showWarning(message: string, title?: string, duration?: number): void {
    this.showNotification({
      id: this.generateId(),
      type: 'warning',
      title: title || '警告',
      message,
      duration: duration || 4000,
    });
  }

  showInfo(message: string, title?: string, duration?: number): void {
    this.showNotification({
      id: this.generateId(),
      type: 'info',
      title: title || '提示',
      message,
      duration: duration || 3000,
    });
  }

  showConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    if (!title || !message) {
      throw new ValidationError('Title and message are required', 'showConfirm');
    }

    if (typeof onConfirm !== 'function') {
      throw new ValidationError('onConfirm must be a function', 'onConfirm');
    }

    this.showModal({
      id: this.generateId(),
      title,
      content: message,
      size: 'medium',
      closable: true,
      actions: [
        {
          label: '取消',
          action: () => {
            if (onCancel) onCancel();
          },
          style: 'secondary',
        },
        {
          label: '确认',
          action: () => {
            onConfirm();
          },
          style: 'primary',
        },
      ],
    });
  }

  showPrompt(
    title: string,
    message: string,
    onSubmit: (value: string) => void,
    defaultValue?: string,
    onCancel?: () => void
  ): void {
    this.showModal({
      id: this.generateId(),
      title,
      content: message,
      size: 'medium',
      closable: true,
      actions: [
        {
          label: '取消',
          action: () => {
            if (onCancel) onCancel();
          },
          style: 'secondary',
        },
        {
          label: '提交',
          action: () => {
            const input = document.querySelector('#prompt-input') as HTMLInputElement;
            const value = input?.value || defaultValue || '';
            onSubmit(value);
          },
          style: 'primary',
        },
      ],
    });
  }

  showAlert(title: string, message: string, onClose?: () => void): void {
    this.showModal({
      id: this.generateId(),
      title,
      content: message,
      size: 'small',
      closable: true,
      actions: [
        {
          label: '确定',
          action: () => {
            if (onClose) onClose();
          },
          style: 'primary',
        },
      ],
    });
  }

  showToast(message: string, type: Notification['type'] = 'info', duration?: number): void {
    this.showNotification({
      id: this.generateId(),
      type,
      title: '',
      message,
      duration: duration || 3000,
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.errorBoundary.removeAllListeners();
    this.removeAllListeners();
    this.eventHandlers.clear();
    this.notifications.clear();
    this.modals.clear();
  }
}
