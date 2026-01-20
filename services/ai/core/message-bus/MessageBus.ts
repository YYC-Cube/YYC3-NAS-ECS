import { ValidationError, TimeoutError, InternalError } from '../error-handler/ErrorTypes';

export interface Message {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface MessageHandler {
  id: string;
  messageType: string;
  handler: (message: Message) => Promise<void> | void;
  filter?: (message: Message) => boolean;
  priority: number;
  enabled: boolean;
  once?: boolean;
}

export interface MessageBusConfig {
  enableMetrics?: boolean;
  enableHistory?: boolean;
  maxHistorySize?: number;
  enablePersistence?: boolean;
  enablePrioritization?: boolean;
  enableBroadcast?: boolean;
  maxMessageSize?: number;
  enableCompression?: boolean;
}

export interface MessageMetrics {
  totalMessages: number;
  messagesByType: Map<string, number>;
  messagesBySource: Map<string, number>;
  handlersCount: number;
  averageProcessingTime: number;
  failedMessages: number;
  lastMessageTime: number;
}

export interface MessageFilter {
  type?: string | string[];
  source?: string | string[];
  target?: string | string[];
  priority?: Message['priority'] | Message['priority'][];
  minTimestamp?: number;
  maxTimestamp?: number;
  custom?: (message: Message) => boolean;
}

export interface Subscription {
  id: string;
  messageType: string;
  handlerId: string;
  createdAt: number;
  filter?: MessageFilter;
}

export class MessageBus extends EventTarget {
  private config: Required<MessageBusConfig>;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private messageHistory: Message[] = [];
  private subscriptions: Map<string, Subscription> = new Map();
  private metrics: MessageMetrics;
  private processingQueue: Map<string, Promise<void>> = new Map();
  private messageIdCounter: number = 0;
  private handlerIdCounter: number = 0;
  private subscriptionIdCounter: number = 0;
  private isPaused: boolean = false;
  private pausedMessages: Message[] = [];

  constructor(config: MessageBusConfig = {}) {
    super();
    this.config = {
      enableMetrics: config.enableMetrics ?? true,
      enableHistory: config.enableHistory ?? true,
      maxHistorySize: config.maxHistorySize ?? 1000,
      enablePersistence: config.enablePersistence ?? false,
      enablePrioritization: config.enablePrioritization ?? true,
      enableBroadcast: config.enableBroadcast ?? true,
      maxMessageSize: config.maxMessageSize ?? 1024 * 1024,
      enableCompression: config.enableCompression ?? false,
    };
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): MessageMetrics {
    return {
      totalMessages: 0,
      messagesByType: new Map(),
      messagesBySource: new Map(),
      handlersCount: 0,
      averageProcessingTime: 0,
      failedMessages: 0,
      lastMessageTime: 0,
    };
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${this.messageIdCounter++}`;
  }

  private generateHandlerId(): string {
    return `handler_${Date.now()}_${this.handlerIdCounter++}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${this.subscriptionIdCounter++}`;
  }

  async publish(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: Message = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      priority: message.priority ?? 'normal',
    };

    if (this.config.enablePrioritization) {
      this.validateMessagePriority(fullMessage);
    }

    if (this.config.enableHistory) {
      this.addToHistory(fullMessage);
    }

    if (this.config.enableMetrics) {
      this.updateMetrics(fullMessage);
    }

    this.dispatchEvent(new CustomEvent('message_published', { detail: fullMessage }));

    const handlers = this.getHandlersForMessage(fullMessage);
    if (handlers.length === 0) {
      this.dispatchEvent(new CustomEvent('message_no_handlers', { detail: fullMessage }));
      return fullMessage.id;
    }

    await this.dispatchToHandlers(fullMessage, handlers);

    if (this.config.enablePersistence) {
      await this.persistMessage(fullMessage);
    }

    return fullMessage.id;
  }

  async publishBatch(messages: Omit<Message, 'id' | 'timestamp'>[]): Promise<string[]> {
    const messageIds: string[] = [];

    for (const message of messages) {
      const id = await this.publish(message);
      messageIds.push(id);
    }

    return messageIds;
  }

  subscribe(
    messageType: string,
    handler: (message: Message) => Promise<void> | void,
    options: {
      filter?: MessageFilter;
      priority?: number;
      once?: boolean;
    } = {}
  ): string {
    const handlerId = this.generateHandlerId();
    const messageHandler: MessageHandler = {
      id: handlerId,
      messageType,
      handler,
      filter: options.filter ? this.createFilterFunction(options.filter) : undefined,
      priority: options.priority ?? 0,
      enabled: true,
      once: options.once ?? false,
    };

    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }

    const handlers = this.handlers.get(messageType)!;
    handlers.push(messageHandler);
    handlers.sort((a, b) => b.priority - a.priority);

    this.metrics.handlersCount++;

    const subscriptionId = this.generateSubscriptionId();
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      messageType,
      handlerId,
      createdAt: Date.now(),
      filter: options.filter,
    });

    this.dispatchEvent(new CustomEvent('subscription_created', { detail: { subscriptionId, messageType, handlerId } }));

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    const handlers = this.handlers.get(subscription.messageType);
    if (handlers) {
      const index = handlers.findIndex(h => h.id === subscription.handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }

    this.subscriptions.delete(subscriptionId);
    this.metrics.handlersCount--;

    this.dispatchEvent(new CustomEvent('subscription_removed', { detail: { subscriptionId } }));

    return true;
  }

  unsubscribeAll(messageType?: string): void {
    if (messageType) {
      const handlers = this.handlers.get(messageType);
      if (handlers) {
        handlers.forEach(handler => {
          const subscription = Array.from(this.subscriptions.values())
            .find(s => s.handlerId === handler.id);
          if (subscription) {
            this.subscriptions.delete(subscription.id);
          }
        });
        handlers.length = 0;
      }
    } else {
      this.handlers.clear();
      this.subscriptions.clear();
      this.metrics.handlersCount = 0;
    }

    this.dispatchEvent(new CustomEvent('subscriptions_cleared', { detail: { messageType } }));
  }

  async send(target: string, message: Omit<Message, 'id' | 'timestamp' | 'target'>): Promise<string> {
    return this.publish({
      ...message,
      target,
    });
  }

  async broadcast(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    if (!this.config.enableBroadcast) {
      throw new InternalError('Broadcast is disabled', {
        additionalData: { config: this.config }
      });
    }

    return this.publish(message);
  }

  async request(
    messageType: string,
    payload: any,
    timeout: number = 5000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateMessageId();
      const responseMessageType = `${messageType}_response`;

      const timeoutId = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error(`Request timeout: ${requestId}`));
      }, timeout);

      const subscriptionId = this.subscribe(responseMessageType, (message) => {
        if (message.metadata?.requestId === requestId) {
          clearTimeout(timeoutId);
          this.unsubscribe(subscriptionId);

          if (message.metadata?.error) {
            reject(new Error(message.metadata.error));
          } else {
            resolve(message.payload);
          }
        }
      });

      this.publish({
        type: messageType,
        source: 'MessageBus',
        payload,
        priority: 'normal',
        metadata: { requestId },
      });
    });
  }

  async reply(originalMessage: Message, responsePayload: any, error?: string): Promise<string> {
    return this.publish({
      type: `${originalMessage.type}_response`,
      source: 'MessageBus',
      target: originalMessage.source,
      payload: responsePayload,
      priority: 'normal',
      metadata: {
        requestId: originalMessage.id,
        error,
      },
    });
  }

  query(filter: MessageFilter): Message[] {
    return this.messageHistory.filter(message => this.matchesFilter(message, filter));
  }

  getHistory(limit?: number): Message[] {
    if (limit) {
      return this.messageHistory.slice(-limit);
    }
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory.length = 0;
    this.dispatchEvent(new CustomEvent('history_cleared', {}));
  }

  getMetrics(): MessageMetrics {
    return {
      ...this.metrics,
      messagesByType: new Map(this.metrics.messagesByType),
      messagesBySource: new Map(this.metrics.messagesBySource),
    };
  }

  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.dispatchEvent(new CustomEvent('metrics_reset', {}));
  }

  private validateMessagePriority(message: Message): void {
    const priorities: Message['priority'][] = ['low', 'normal', 'high', 'critical'];
    if (!priorities.includes(message.priority)) {
      throw new ValidationError(`Invalid message priority: ${message.priority}`, 'priority', {
        additionalData: { messagePriority: message.priority, validPriorities: priorities }
      });
    }
  }

  private addToHistory(message: Message): void {
    this.messageHistory.push(message);

    if (this.messageHistory.length > this.config.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  private updateMetrics(message: Message): void {
    this.metrics.totalMessages++;
    this.metrics.lastMessageTime = message.timestamp;

    const typeCount = this.metrics.messagesByType.get(message.type) ?? 0;
    this.metrics.messagesByType.set(message.type, typeCount + 1);

    const sourceCount = this.metrics.messagesBySource.get(message.source) ?? 0;
    this.metrics.messagesBySource.set(message.source, sourceCount + 1);
  }

  private getHandlersForMessage(message: Message): MessageHandler[] {
    const handlers: MessageHandler[] = [];

    Array.from(this.handlers.entries()).forEach(([messageType, messageHandlers]) => {
      if (this.messageTypeMatches(messageType, message.type)) {
        for (const handler of messageHandlers) {
          if (handler.enabled && (!handler.filter || handler.filter(message))) {
            handlers.push(handler);
          }
        }
      }
    });

    return handlers;
  }

  private messageTypeMatches(pattern: string, type: string): boolean {
    if (pattern === '*') {
      return true;
    }

    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(type);
    }

    return pattern === type;
  }

  private async dispatchToHandlers(message: Message, handlers: MessageHandler[]): Promise<void> {
    const promises = handlers.map(handler => this.executeHandler(message, handler));
    await Promise.allSettled(promises);
  }

  private async executeHandler(message: Message, handler: MessageHandler): Promise<void> {
    const startTime = Date.now();

    try {
      await handler.handler(message);

      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);

      if (handler.once) {
        this.disableHandler(handler.id);
      }
    } catch (error) {
      this.metrics.failedMessages++;
      this.dispatchEvent(new CustomEvent('handler_error', {
        detail: { handlerId: handler.id, message, error },
      }));
    }
  }

  private disableHandler(handlerId: string): void {
    Array.from(this.handlers.values()).forEach(handlers => {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) {
        handler.enabled = false;
        return;
      }
    });
  }

  private createFilterFunction(filter: MessageFilter): (message: Message) => boolean {
    return (message: Message) => this.matchesFilter(message, filter);
  }

  private matchesFilter(message: Message, filter: MessageFilter): boolean {
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!types.some(t => this.messageTypeMatches(t, message.type))) {
        return false;
      }
    }

    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
      if (!sources.includes(message.source)) {
        return false;
      }
    }

    if (filter.target) {
      const targets = Array.isArray(filter.target) ? filter.target : [filter.target];
      if (!message.target || !targets.includes(message.target)) {
        return false;
      }
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (!priorities.includes(message.priority)) {
        return false;
      }
    }

    if (filter.minTimestamp && message.timestamp < filter.minTimestamp) {
      return false;
    }

    if (filter.maxTimestamp && message.timestamp > filter.maxTimestamp) {
      return false;
    }

    if (filter.custom && !filter.custom(message)) {
      return false;
    }

    return true;
  }

  private updateAverageProcessingTime(processingTime: number): void {
    const total = this.metrics.averageProcessingTime * (this.metrics.totalMessages - 1);
    this.metrics.averageProcessingTime = (total + processingTime) / this.metrics.totalMessages;
  }

  private async persistMessage(message: Message): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = `message_${message.id}`;
        const value = JSON.stringify(message);
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.error('Failed to persist message:', error);
      }
    }
  }

  pause(): void {
    this.isPaused = true;
    this.dispatchEvent(new CustomEvent('messagebus_paused', {}));
  }

  resume(): void {
    this.isPaused = false;
    this.dispatchEvent(new CustomEvent('messagebus_resumed', {}));
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  async restoreMessages(): Promise<Message[]> {
    if (typeof window !== 'undefined' && window.localStorage) {
      const messages: Message[] = [];
      const keys = Object.keys(window.localStorage);

      for (const key of keys) {
        if (key.startsWith('message_')) {
          try {
            const value = window.localStorage.getItem(key);
            if (value) {
              const message = JSON.parse(value) as Message;
              messages.push(message);
            }
          } catch (error) {
            console.error('Failed to restore message:', error);
          }
        }
      }

      return messages;
    }

    return [];
  }

  destroy(): void {
    this.handlers.clear();
    this.subscriptions.clear();
    this.messageHistory.length = 0;
    this.metrics = this.initializeMetrics();
  }
}
