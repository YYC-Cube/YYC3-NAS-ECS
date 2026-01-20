/**
 * @file 高级拖拽系统
 * @description 提供高性能、可配置的拖拽功能，支持边界限制和拖拽约束
 * @module ui/widget/AdvancedDragSystem
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';

export interface DragConfig {
  enabled?: boolean;
  handle?: string | null;
  boundary?: Boundary;
  constraints?: DragConstraints;
  snapToGrid?: boolean;
  gridSize?: number;
  inertia?: boolean;
  inertiaDuration?: number;
  throttleDelay?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  cursor?: string;
  zIndex?: number;
}

export interface Boundary {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface DragConstraints {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  lockX?: boolean;
  lockY?: boolean;
  lockAxis?: 'x' | 'y';
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface DragDelta {
  dx: number;
  dy: number;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  startTime: number;
  duration: number;
}

export interface DragEvent {
  type: 'start' | 'move' | 'end' | 'cancel';
  position: DragPosition;
  delta: DragDelta;
  state: DragState;
  originalEvent: MouseEvent | TouchEvent;
}

export class AdvancedDragSystem extends EventEmitter {
  private config: Required<DragConfig>;
  private element: HTMLElement | null;
  private handleElement: HTMLElement | null;
  private state: DragState;
  private startPosition: DragPosition;
  private currentPosition: DragPosition;
  private throttleTimer: NodeJS.Timeout | null;
  private rafId: number | null;
  private inertiaRafId: number | null;
  private velocity: { x: number; y: number };
  private lastTimestamp: number;
  private dragHistory: DragPosition[];
  private maxHistorySize: number;

  constructor(config: DragConfig = {}) {
    super();

    this.config = {
      enabled: true,
      handle: null,
      boundary: {},
      constraints: {},
      snapToGrid: false,
      gridSize: 10,
      inertia: false,
      inertiaDuration: 300,
      throttleDelay: 16,
      preventDefault: true,
      stopPropagation: false,
      cursor: 'move',
      zIndex: 1000,
      ...config,
    };

    this.element = null;
    this.handleElement = null;
    this.state = this.createInitialState();
    this.startPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };
    this.throttleTimer = null;
    this.rafId = null;
    this.inertiaRafId = null;
    this.velocity = { x: 0, y: 0 };
    this.lastTimestamp = 0;
    this.dragHistory = [];
    this.maxHistorySize = 10;
  }

  private createInitialState(): DragState {
    return {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      startTime: 0,
      duration: 0,
    };
  }

  attach(element: HTMLElement): void {
    if (this.element) {
      this.detach();
    }

    this.element = element;

    if (this.config.handle) {
      this.handleElement = element.querySelector(this.config.handle) as HTMLElement;
    }

    const targetElement = this.handleElement || element;
    targetElement.style.cursor = this.config.cursor;
    targetElement.style.userSelect = 'none';

    targetElement.addEventListener('mousedown', this.handleMouseDown);
    targetElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });

    this.emit('attached', element);
  }

  detach(): void {
    if (!this.element) return;

    const targetElement = this.handleElement || this.element;
    targetElement.removeEventListener('mousedown', this.handleMouseDown);
    targetElement.removeEventListener('touchstart', this.handleTouchStart);

    this.element.style.cursor = '';
    this.element.style.userSelect = '';
    this.element = null;
    this.handleElement = null;

    this.emit('detached');
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.config.enabled) return;
    if (this.config.handle && !this.handleElement?.contains(e.target as Node)) return;

    e.preventDefault();
    this.startDrag(e.clientX, e.clientY, e);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (!this.config.enabled) return;
    if (this.config.handle && !this.handleElement?.contains(e.target as Node)) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    this.startDrag(touch.clientX, touch.clientY, e);
  };

  private startDrag(clientX: number, clientY: number, originalEvent: MouseEvent | TouchEvent): void {
    if (!this.element) return;

    this.state.isDragging = true;
    this.state.startX = clientX;
    this.state.startY = clientY;
    this.state.currentX = clientX;
    this.state.currentY = clientY;
    this.state.deltaX = 0;
    this.state.deltaY = 0;
    this.state.startTime = Date.now();
    this.state.duration = 0;

    const rect = this.element.getBoundingClientRect();
    this.startPosition = { x: rect.left, y: rect.top };
    this.currentPosition = { ...this.startPosition };

    this.velocity = { x: 0, y: 0 };
    this.lastTimestamp = Date.now();
    this.dragHistory = [{ x: clientX, y: clientY }];

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);

    if (this.config.zIndex) {
      this.element.style.zIndex = String(this.config.zIndex);
    }

    const event: DragEvent = {
      type: 'start',
      position: this.currentPosition,
      delta: { dx: 0, dy: 0 },
      state: { ...this.state },
      originalEvent,
    };

    this.emit('drag:start', event);
  }

  private handleMouseMove: (e: MouseEvent) => void = (e: MouseEvent): void => {
    if (!this.state.isDragging) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    if (this.config.stopPropagation) {
      e.stopPropagation();
    }

    this.updateDrag(e.clientX, e.clientY, e);
  };

  private handleTouchMove: (e: TouchEvent) => void = (e: TouchEvent): void => {
    if (!this.state.isDragging) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    if (this.config.stopPropagation) {
      e.stopPropagation();
    }

    const touch = e.touches[0];
    this.updateDrag(touch.clientX, touch.clientY, e);
  };

  private updateDrag(clientX: number, clientY: number, originalEvent: MouseEvent | TouchEvent): void {
    const now = Date.now();
    const deltaTime = now - this.lastTimestamp;

    this.velocity = {
      x: (clientX - this.state.currentX) / deltaTime,
      y: (clientY - this.state.currentY) / deltaTime,
    };

    this.lastTimestamp = now;

    this.state.currentX = clientX;
    this.state.currentY = clientY;
    this.state.deltaX = clientX - this.state.startX;
    this.state.deltaY = clientY - this.state.startY;
    this.state.duration = now - this.state.startTime;

    this.dragHistory.push({ x: clientX, y: clientY });
    if (this.dragHistory.length > this.maxHistorySize) {
      this.dragHistory.shift();
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.applyDrag();
    });

    if (this.config.throttleDelay > 0) {
      if (this.throttleTimer) {
        clearTimeout(this.throttleTimer);
      }

      this.throttleTimer = setTimeout(() => {
        const event: DragEvent = {
          type: 'move',
          position: this.currentPosition,
          delta: { dx: this.state.deltaX, dy: this.state.deltaY },
          state: { ...this.state },
          originalEvent,
        };

        this.emit('drag:move', event);
      }, this.config.throttleDelay);
    } else {
      const event: DragEvent = {
        type: 'move',
        position: this.currentPosition,
        delta: { dx: this.state.deltaX, dy: this.state.deltaY },
        state: { ...this.state },
        originalEvent,
      };

      this.emit('drag:move', event);
    }
  }

  private applyDrag(): void {
    if (!this.element) return;

    let newX = this.startPosition.x + this.state.deltaX;
    let newY = this.startPosition.y + this.state.deltaY;

    if (this.config.constraints.lockX) {
      newX = this.startPosition.x;
    }

    if (this.config.constraints.lockY) {
      newY = this.startPosition.y;
    }

    if (this.config.constraints.lockAxis === 'x') {
      newY = this.startPosition.y;
    } else if (this.config.constraints.lockAxis === 'y') {
      newX = this.startPosition.x;
    }

    if (this.config.constraints.minX !== undefined) {
      newX = Math.max(newX, this.config.constraints.minX);
    }

    if (this.config.constraints.maxX !== undefined) {
      newX = Math.min(newX, this.config.constraints.maxX);
    }

    if (this.config.constraints.minY !== undefined) {
      newY = Math.max(newY, this.config.constraints.minY);
    }

    if (this.config.constraints.maxY !== undefined) {
      newY = Math.min(newY, this.config.constraints.maxY);
    }

    if (this.config.boundary.left !== undefined) {
      newX = Math.max(newX, this.config.boundary.left);
    }

    if (this.config.boundary.top !== undefined) {
      newY = Math.max(newY, this.config.boundary.top);
    }

    if (this.config.boundary.right !== undefined) {
      const rect = this.element.getBoundingClientRect();
      newX = Math.min(newX, this.config.boundary.right - rect.width);
    }

    if (this.config.boundary.bottom !== undefined) {
      const rect = this.element.getBoundingClientRect();
      newY = Math.min(newY, this.config.boundary.bottom - rect.height);
    }

    if (this.config.snapToGrid) {
      newX = Math.round(newX / this.config.gridSize) * this.config.gridSize;
      newY = Math.round(newY / this.config.gridSize) * this.config.gridSize;
    }

    this.currentPosition = { x: newX, y: newY };
    this.element.style.transform = `translate(${newX}px, ${newY}px)`;
  }

  private handleMouseUp: (e: MouseEvent) => void = (e: MouseEvent): void => {
    this.endDrag(e);
  };

  private handleTouchEnd: (e: TouchEvent) => void = (e: TouchEvent): void => {
    this.endDrag(e);
  };

  private endDrag(originalEvent: MouseEvent | TouchEvent): void {
    if (!this.state.isDragging) return;

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.state.isDragging = false;

    const event: DragEvent = {
      type: 'end',
      position: this.currentPosition,
      delta: { dx: this.state.deltaX, dy: this.state.deltaY },
      state: { ...this.state },
      originalEvent,
    };

    this.emit('drag:end', event);

    if (this.config.inertia) {
      this.applyInertia();
    }
  }

  private applyInertia(): void {
    if (!this.element) return;

    const startTime = Date.now();
    const duration = this.config.inertiaDuration;
    const startX = this.currentPosition.x;
    const startY = this.currentPosition.y;
    const velocityX = this.velocity.x * 20;
    const velocityY = this.velocity.y * 20;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const newX = startX + velocityX * easeOut;
      const newY = startY + velocityY * easeOut;

      this.currentPosition = { x: newX, y: newY };
      this.element.style.transform = `translate(${newX}px, ${newY}px)`;

      if (progress < 1) {
        this.inertiaRafId = requestAnimationFrame(animate);
      } else {
        this.inertiaRafId = null;
      }
    };

    this.inertiaRafId = requestAnimationFrame(animate);
  }

  cancelDrag(): void {
    if (!this.state.isDragging) return;

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.inertiaRafId) {
      cancelAnimationFrame(this.inertiaRafId);
      this.inertiaRafId = null;
    }

    this.state.isDragging = false;

    if (this.element) {
      this.element.style.transform = `translate(${this.startPosition.x}px, ${this.startPosition.y}px)`;
      this.currentPosition = { ...this.startPosition };
    }

    this.emit('drag:cancel', {
      type: 'cancel',
      position: this.startPosition,
      delta: { dx: 0, dy: 0 },
      state: { ...this.state },
      originalEvent: null as any,
    });
  }

  setPosition(x: number, y: number): void {
    this.startPosition = { x, y };
    this.currentPosition = { x, y };

    if (this.element) {
      this.element.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  getPosition(): DragPosition {
    return { ...this.currentPosition };
  }

  getState(): DragState {
    return { ...this.state };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (this.element) {
      const targetElement = this.handleElement || this.element;
      targetElement.style.cursor = enabled ? this.config.cursor : 'default';
    }

    this.emit('enabled:changed', enabled);
  }

  setConfig(config: Partial<DragConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.element) {
      const targetElement = this.handleElement || this.element;
      targetElement.style.cursor = this.config.enabled ? this.config.cursor : 'default';
    }

    this.emit('config:changed', this.config);
  }

  getConfig(): Required<DragConfig> {
    return { ...this.config };
  }

  destroy(): void {
    this.detach();

    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.inertiaRafId) {
      cancelAnimationFrame(this.inertiaRafId);
      this.inertiaRafId = null;
    }

    this.removeAllListeners();
    this.emit('destroyed');
  }
}
