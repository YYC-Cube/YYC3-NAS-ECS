/**
 * @file 浏览器兼容的事件发射器
 * @description 提供浏览器兼容的事件发射器实现，替代Node.js的events模块
 * @module utils/EventEmitter
 * @author YYC³
 * @version 1.0.0
 * @created 2026-02-03
 */

export interface EventEmitterOptions {
  captureRejections?: boolean;
}

export type EventListener = (...args: any[]) => void;
export type EventMap = Record<string, EventListener[]>;

export class EventEmitter {
  private _events: EventMap;
  private _maxListeners: number;
  private _captureRejections: boolean;

  constructor(options?: EventEmitterOptions) {
    this._events = Object.create(null);
    this._maxListeners = EventEmitter.defaultMaxListeners;
    this._captureRejections = options?.captureRejections || false;
  }

  static defaultMaxListeners: number = 10;

  setMaxListeners(n: number): this {
    if (typeof n !== 'number' || n < 0) {
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number.');
    }
    this._maxListeners = n;
    return this;
  }

  getMaxListeners(): number {
    return this._maxListeners;
  }

  static listenerCount(emitter: EventEmitter, event: string): number {
    return emitter.listenerCount(event);
  }

  eventNames(): string[] {
    return Object.keys(this._events);
  }

  listenerCount(event: string): number {
    const listeners = this._events[event];
    return listeners ? listeners.length : 0;
  }

  on(event: string, listener: EventListener): this {
    return this.addListener(event, listener);
  }

  addListener(event: string, listener: EventListener): this {
    this._checkEvent(event);
    this._events[event].push(listener);
    
    if (this._events[event].length > this._maxListeners) {
      const warning = new Error(`Possible EventEmitter memory leak detected. ${this._events[event].length} ${event} listeners added. Use emitter.setMaxListeners() to increase limit`);
      warning.name = 'MaxListenersExceededWarning';
      console.warn(warning);
    }
    
    return this;
  }

  once(event: string, listener: EventListener): this {
    const wrapped: EventListener = (...args: any[]) => {
      this.removeListener(event, wrapped);
      listener.apply(this, args);
    };
    
    this.on(event, wrapped);
    return this;
  }

  off(event: string, listener: EventListener): this {
    return this.removeListener(event, listener);
  }

  removeListener(event: string, listener: EventListener): this {
    const listeners = this._events[event];
    if (!listeners) return this;
    
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this._events[event];
    } else {
      this._events = Object.create(null);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    this._checkEvent(event);
    
    const listeners = [...this._events[event]];
    let hasListeners = listeners.length > 0;
    
    for (const listener of listeners) {
      try {
        listener.apply(this, args);
      } catch (err) {
        if (this._captureRejections) {
          Promise.reject(err).catch(() => {});
        } else {
          setTimeout(() => {
            throw err;
          }, 0);
        }
      }
    }
    
    return hasListeners;
  }

  rawListeners(event: string): EventListener[] {
    this._checkEvent(event);
    return [...this._events[event]];
  }

  prependListener(event: string, listener: EventListener): this {
    this._checkEvent(event);
    this._events[event].unshift(listener);
    return this;
  }

  prependOnceListener(event: string, listener: EventListener): this {
    const wrapped: EventListener = (...args: any[]) => {
      this.removeListener(event, wrapped);
      listener.apply(this, args);
    };
    
    this.prependListener(event, wrapped);
    return this;
  }

  private _checkEvent(event: string): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
  }
}

export default EventEmitter;
