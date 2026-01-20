/**
 * @file 事件分发器
 * @description 实现事件分发系统，支持事件过滤、优先级、异步处理等功能
 * @module event-dispatcher
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';

export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  payload: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface EventHandler {
  id: string;
  eventType: string;
  handler: (event: SystemEvent) => Promise<void> | void;
  filter?: (event: SystemEvent) => boolean;
  priority: number;
  once: boolean;
  enabled: boolean;
}

export interface EventDispatcherConfig {
  enableMetrics?: boolean;
  enableHistory?: boolean;
  maxHistorySize?: number;
  enableAsync?: boolean;
  maxConcurrentHandlers?: number;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  handlersCount: number;
  averageProcessingTime: number;
  errorCount: number;
  successCount: number;
}

export class EventDispatcher extends EventEmitter {
  private config: Required<EventDispatcherConfig>;
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventHistory: SystemEvent[] = [];
  private metrics: EventMetrics;
  private processingQueue: Map<string, Promise<void>> = new Map();

  constructor(config: EventDispatcherConfig = {}) {
    super();
    this.config = {
      enableMetrics: config.enableMetrics ?? true,
      enableHistory: config.enableHistory ?? true,
      maxHistorySize: config.maxHistorySize ?? 1000,
      enableAsync: config.enableAsync ?? true,
      maxConcurrentHandlers: config.maxConcurrentHandlers ?? 10,
    };
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): EventMetrics {
    return {
      totalEvents: 0,
      eventsByType: {},
      handlersCount: 0,
      averageProcessingTime: 0,
      errorCount: 0,
      successCount: 0,
    };
  }

  async dispatch(event: Omit<SystemEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SystemEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      priority: event.priority ?? 'normal',
    };

    if (this.config.enableHistory) {
      this.addToHistory(fullEvent);
    }

    if (this.config.enableMetrics) {
      this.updateMetrics(fullEvent, 'dispatched');
    }

    this.emit('event_dispatched', fullEvent);

    const handlers = this.getHandlersForEvent(fullEvent);
    if (handlers.length === 0) {
      this.emit('event_no_handlers', fullEvent);
      return;
    }

    if (this.config.enableAsync) {
      await this.dispatchAsync(fullEvent, handlers);
    } else {
      await this.dispatchSync(fullEvent, handlers);
    }
  }

  onEvent(
    eventType: string,
    handler: (event: SystemEvent) => Promise<void> | void,
    options: {
      filter?: (event: SystemEvent) => boolean;
      priority?: number;
      once?: boolean;
    } = {}
  ): string {
    const handlerId = this.generateHandlerId();
    const eventHandler: EventHandler = {
      id: handlerId,
      eventType,
      handler,
      filter: options.filter,
      priority: options.priority ?? 0,
      once: options.once ?? false,
      enabled: true,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(eventHandler);
    handlers.sort((a, b) => b.priority - a.priority);

    this.metrics.handlersCount++;
    this.emit('handler_registered', { handlerId, eventType });

    return handlerId;
  }

  on(
    eventType: string,
    handler: (...args: any[]) => void,
    options?: {
      filter?: (event: SystemEvent) => boolean;
      priority?: number;
      once?: boolean;
    }
  ): this {
    return super.on(eventType, handler);
  }

  onceEvent(
    eventType: string,
    handler: (event: SystemEvent) => Promise<void> | void,
    options: {
      filter?: (event: SystemEvent) => boolean;
      priority?: number;
    } = {}
  ): string {
    return this.onEvent(eventType, handler, { ...options, once: true });
  }

  offHandler(handlerId: string): void {
    Array.from(this.handlers.entries()).forEach(([eventType, handlers]) => {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.metrics.handlersCount--;
        this.emit('handler_unregistered', { handlerId, eventType });
        return;
      }
    });
  }

  offAll(eventType?: string): void {
    if (eventType) {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        this.metrics.handlersCount -= handlers.length;
        this.handlers.delete(eventType);
        this.emit('handlers_unregistered', { eventType, count: handlers.length });
      }
    } else {
      const totalHandlers = Array.from(this.handlers.values()).flat().length;
      this.handlers.clear();
      this.metrics.handlersCount = 0;
      this.emit('all_handlers_unregistered', { count: totalHandlers });
    }
  }

  private async dispatchAsync(event: SystemEvent, handlers: EventHandler[]): Promise<void> {
    const promises = handlers.map(handler => this.executeHandler(event, handler));
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('[EventDispatcher] Error in async dispatch:', error);
    }
  }

  private async dispatchSync(event: SystemEvent, handlers: EventHandler[]): Promise<void> {
    for (const handler of handlers) {
      await this.executeHandler(event, handler);
    }
  }

  private async executeHandler(event: SystemEvent, handler: EventHandler): Promise<void> {
    if (!handler.enabled) return;
    if (handler.filter && !handler.filter(event)) return;

    const startTime = Date.now();

    try {
      await handler.handler(event);
      
      if (this.config.enableMetrics) {
        this.metrics.successCount++;
        this.updateAverageProcessingTime(Date.now() - startTime);
      }

      if (handler.once) {
        this.offHandler(handler.id);
      }
    } catch (error) {
      if (this.config.enableMetrics) {
        this.metrics.errorCount++;
      }

      this.emit('handler_error', {
        handlerId: handler.id,
        eventType: event.type,
        error,
      });
    }
  }

  private getHandlersForEvent(event: SystemEvent): EventHandler[] {
    const handlers = this.handlers.get(event.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    
    return [...handlers, ...wildcardHandlers];
  }

  private addToHistory(event: SystemEvent): void {
    this.eventHistory.push(event);
    
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private updateMetrics(event: SystemEvent, action: 'dispatched'): void {
    if (!this.config.enableMetrics) return;

    if (action === 'dispatched') {
      this.metrics.totalEvents++;
      this.metrics.eventsByType[event.type] = 
        (this.metrics.eventsByType[event.type] || 0) + 1;
    }
  }

  private updateAverageProcessingTime(processingTime: number): void {
    if (!this.config.enableMetrics) return;

    const current = this.metrics.averageProcessingTime;
    const count = this.metrics.successCount;
    this.metrics.averageProcessingTime = 
      (current * (count - 1) + processingTime) / count;
  }

  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  getHistory(limit: number = 100): SystemEvent[] {
    return this.eventHistory.slice(-limit);
  }

  getHandlers(eventType?: string): EventHandler[] {
    if (eventType) {
      return this.handlers.get(eventType) || [];
    }
    return Array.from(this.handlers.values()).flat();
  }

  enableHandler(handlerId: string): void {
    Array.from(this.handlers.values()).forEach(handlers => {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) {
        handler.enabled = true;
        this.emit('handler_enabled', { handlerId });
        return;
      }
    });
  }

  disableHandler(handlerId: string): void {
    Array.from(this.handlers.values()).forEach(handlers => {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) {
        handler.enabled = false;
        this.emit('handler_disabled', { handlerId });
        return;
      }
    });
  }

  clearHistory(): void {
    this.eventHistory = [];
    this.emit('history_cleared');
  }

  clearMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.emit('metrics_cleared');
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHandlerId(): string {
    return `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.offAll();
    this.clearHistory();
    this.clearMetrics();
    this.removeAllListeners();
  }
}

export default EventDispatcher;
