/**
 * @file 调整大小系统
 * @description 提供高性能、可配置的窗口调整大小功能，支持八个方向调整和约束
 * @module ui/widget/ResizeSystem
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';

export interface ResizeConfig {
  enabled?: boolean;
  handles?: ResizeEdge[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  lockAspectRatio?: boolean;
  aspectRatio?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  throttleDelay?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  handleSize?: number;
  handleOffset?: number;
  boundary?: ResizeBoundary;
  animationDuration?: number;
  animationEasing?: string;
}

export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeBoundary {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface ResizePosition {
  x: number;
  y: number;
}

export interface ResizeSize {
  width: number;
  height: number;
}

export interface ResizeState {
  isResizing: boolean;
  edge: ResizeEdge | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
  currentWidth: number;
  currentHeight: number;
  currentLeft: number;
  currentTop: number;
  startTime: number;
  duration: number;
}

export interface ResizeEvent {
  type: 'start' | 'move' | 'end' | 'cancel';
  size: ResizeSize;
  position: ResizePosition;
  edge: ResizeEdge | null;
  state: ResizeState;
  originalEvent: MouseEvent | TouchEvent;
}

export class ResizeSystem extends EventEmitter {
  private config: Required<ResizeConfig>;
  private element: HTMLElement | null;
  private handles: Map<ResizeEdge, HTMLElement>;
  private state: ResizeState;
  private startSize: ResizeSize;
  private startPosition: ResizePosition;
  private currentSize: ResizeSize;
  private currentPosition: ResizePosition;
  private throttleTimer: NodeJS.Timeout | null;
  private rafId: number | null;
  private resizeEdge: ResizeEdge | null;

  constructor(config: ResizeConfig = {}) {
    super();

    this.config = {
      enabled: true,
      handles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
      minWidth: 200,
      minHeight: 150,
      maxWidth: Number.MAX_VALUE,
      maxHeight: Number.MAX_VALUE,
      lockAspectRatio: false,
      aspectRatio: 0,
      snapToGrid: false,
      gridSize: 10,
      throttleDelay: 16,
      preventDefault: true,
      stopPropagation: false,
      handleSize: 8,
      handleOffset: 0,
      boundary: {},
      animationDuration: 150,
      animationEasing: 'ease-out',
      ...config,
    };

    this.element = null;
    this.handles = new Map();
    this.state = this.createInitialState();
    this.startSize = { width: 0, height: 0 };
    this.startPosition = { x: 0, y: 0 };
    this.currentSize = { width: 0, height: 0 };
    this.currentPosition = { x: 0, y: 0 };
    this.throttleTimer = null;
    this.rafId = null;
    this.resizeEdge = null;
  }

  private createInitialState(): ResizeState {
    return {
      isResizing: false,
      edge: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      startLeft: 0,
      startTop: 0,
      currentWidth: 0,
      currentHeight: 0,
      currentLeft: 0,
      currentTop: 0,
      startTime: 0,
      duration: 0,
    };
  }

  attach(element: HTMLElement): void {
    if (this.element) {
      this.detach();
    }

    this.element = element;
    this.createHandles();
    this.updateElementSize();

    this.emit('attached', element);
  }

  detach(): void {
    if (!this.element) return;

    this.handles.forEach((handle) => {
      handle.remove();
    });

    this.handles.clear();
    this.element = null;

    this.emit('detached');
  }

  private createHandles(): void {
    if (!this.element) return;

    this.config.handles.forEach((edge) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${edge}`;
      handle.style.position = 'absolute';
      handle.style.width = `${this.config.handleSize}px`;
      handle.style.height = `${this.config.handleSize}px`;
      handle.style.backgroundColor = 'transparent';
      handle.style.zIndex = '1001';
      handle.style.cursor = this.getCursorForEdge(edge);

      this.positionHandle(handle, edge);
      this.addHandleEvents(handle, edge);

      this.element!.appendChild(handle);
      this.handles.set(edge, handle);
    });
  }

  private positionHandle(handle: HTMLElement, edge: ResizeEdge): void {
    const offset = this.config.handleOffset;
    const size = this.config.handleSize;

    switch (edge) {
      case 'n':
        handle.style.top = `${offset - size / 2}px`;
        handle.style.left = '50%';
        handle.style.transform = 'translateX(-50%)';
        break;
      case 's':
        handle.style.bottom = `${offset - size / 2}px`;
        handle.style.left = '50%';
        handle.style.transform = 'translateX(-50%)';
        break;
      case 'e':
        handle.style.right = `${offset - size / 2}px`;
        handle.style.top = '50%';
        handle.style.transform = 'translateY(-50%)';
        break;
      case 'w':
        handle.style.left = `${offset - size / 2}px`;
        handle.style.top = '50%';
        handle.style.transform = 'translateY(-50%)';
        break;
      case 'ne':
        handle.style.top = `${offset - size / 2}px`;
        handle.style.right = `${offset - size / 2}px`;
        break;
      case 'nw':
        handle.style.top = `${offset - size / 2}px`;
        handle.style.left = `${offset - size / 2}px`;
        break;
      case 'se':
        handle.style.bottom = `${offset - size / 2}px`;
        handle.style.right = `${offset - size / 2}px`;
        break;
      case 'sw':
        handle.style.bottom = `${offset - size / 2}px`;
        handle.style.left = `${offset - size / 2}px`;
        break;
    }
  }

  private getCursorForEdge(edge: ResizeEdge): string {
    const cursors: Record<ResizeEdge, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
    };
    return cursors[edge];
  }

  private addHandleEvents(handle: HTMLElement, edge: ResizeEdge): void {
    handle.addEventListener('mousedown', (e) => this.handleMouseDown(e, edge));
    handle.addEventListener('touchstart', (e) => this.handleTouchStart(e, edge), { passive: false });
  }

  private handleMouseDown = (e: MouseEvent, edge: ResizeEdge): void => {
    if (!this.config.enabled) return;

    e.preventDefault();
    this.startResize(e.clientX, e.clientY, edge, e);
  };

  private handleTouchStart = (e: TouchEvent, edge: ResizeEdge): void => {
    if (!this.config.enabled) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    this.startResize(touch.clientX, touch.clientY, edge, e);
  };

  private startResize(clientX: number, clientY: number, edge: ResizeEdge, originalEvent: MouseEvent | TouchEvent): void {
    if (!this.element) return;

    this.state.isResizing = true;
    this.state.edge = edge;
    this.state.startX = clientX;
    this.state.startY = clientY;
    this.state.startTime = Date.now();
    this.state.duration = 0;

    const rect = this.element.getBoundingClientRect();
    const style = window.getComputedStyle(this.element);

    this.state.startWidth = rect.width;
    this.state.startHeight = rect.height;
    this.state.startLeft = rect.left;
    this.state.startTop = rect.top;

    this.state.currentWidth = this.state.startWidth;
    this.state.currentHeight = this.state.startHeight;
    this.state.currentLeft = this.state.startLeft;
    this.state.currentTop = this.state.startTop;

    this.startSize = { width: this.state.startWidth, height: this.state.startHeight };
    this.startPosition = { x: this.state.startLeft, y: this.state.startTop };
    this.currentSize = { ...this.startSize };
    this.currentPosition = { ...this.startPosition };

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);

    const event: ResizeEvent = {
      type: 'start',
      size: this.currentSize,
      position: this.currentPosition,
      edge: edge,
      state: { ...this.state },
      originalEvent,
    };

    this.emit('resize:start', event);
  }

  private handleMouseMove: (e: MouseEvent) => void = (e: MouseEvent): void => {
    if (!this.state.isResizing) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    if (this.config.stopPropagation) {
      e.stopPropagation();
    }

    this.updateResize(e.clientX, e.clientY, e);
  };

  private handleTouchMove: (e: TouchEvent) => void = (e: TouchEvent): void => {
    if (!this.state.isResizing) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    if (this.config.stopPropagation) {
      e.stopPropagation();
    }

    const touch = e.touches[0];
    this.updateResize(touch.clientX, touch.clientY, e);
  };

  private updateResize(clientX: number, clientY: number, originalEvent: MouseEvent | TouchEvent): void {
    const deltaX = clientX - this.state.startX;
    const deltaY = clientY - this.state.startY;

    let newWidth = this.state.startWidth;
    let newHeight = this.state.startHeight;
    let newLeft = this.state.startLeft;
    let newTop = this.state.startTop;

    const edge = this.state.edge!;

    if (edge.includes('e')) {
      newWidth = this.state.startWidth + deltaX;
    } else if (edge.includes('w')) {
      newWidth = this.state.startWidth - deltaX;
      newLeft = this.state.startLeft + deltaX;
    }

    if (edge.includes('s')) {
      newHeight = this.state.startHeight + deltaY;
    } else if (edge.includes('n')) {
      newHeight = this.state.startHeight - deltaY;
      newTop = this.state.startTop + deltaY;
    }

    if (this.config.lockAspectRatio) {
      const aspectRatio = this.config.aspectRatio || this.state.startWidth / this.state.startHeight;

      if (edge.includes('e') || edge.includes('w')) {
        newHeight = newWidth / aspectRatio;
        if (edge.includes('n')) {
          newTop = this.state.startTop + (this.state.startHeight - newHeight);
        }
      } else if (edge.includes('n') || edge.includes('s')) {
        newWidth = newHeight * aspectRatio;
        if (edge.includes('w')) {
          newLeft = this.state.startLeft + (this.state.startWidth - newWidth);
        }
      }
    }

    newWidth = Math.max(this.config.minWidth, Math.min(newWidth, this.config.maxWidth));
    newHeight = Math.max(this.config.minHeight, Math.min(newHeight, this.config.maxHeight));

    if (this.config.snapToGrid) {
      newWidth = Math.round(newWidth / this.config.gridSize) * this.config.gridSize;
      newHeight = Math.round(newHeight / this.config.gridSize) * this.config.gridSize;
    }

    if (this.config.boundary.left !== undefined) {
      if (newLeft < this.config.boundary.left) {
        newWidth = newWidth - (this.config.boundary.left - newLeft);
        newLeft = this.config.boundary.left;
      }
    }

    if (this.config.boundary.top !== undefined) {
      if (newTop < this.config.boundary.top) {
        newHeight = newHeight - (this.config.boundary.top - newTop);
        newTop = this.config.boundary.top;
      }
    }

    if (this.config.boundary.right !== undefined) {
      if (newLeft + newWidth > this.config.boundary.right) {
        newWidth = this.config.boundary.right - newLeft;
      }
    }

    if (this.config.boundary.bottom !== undefined) {
      if (newTop + newHeight > this.config.boundary.bottom) {
        newHeight = this.config.boundary.bottom - newTop;
      }
    }

    this.state.currentWidth = newWidth;
    this.state.currentHeight = newHeight;
    this.state.currentLeft = newLeft;
    this.state.currentTop = newTop;
    this.state.duration = Date.now() - this.state.startTime;

    this.currentSize = { width: newWidth, height: newHeight };
    this.currentPosition = { x: newLeft, y: newTop };

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.applyResize();
    });

    if (this.config.throttleDelay > 0) {
      if (this.throttleTimer) {
        clearTimeout(this.throttleTimer);
      }

      this.throttleTimer = setTimeout(() => {
        const event: ResizeEvent = {
          type: 'move',
          size: this.currentSize,
          position: this.currentPosition,
          edge: this.state.edge,
          state: { ...this.state },
          originalEvent,
        };

        this.emit('resize:move', event);
      }, this.config.throttleDelay);
    } else {
      const event: ResizeEvent = {
        type: 'move',
        size: this.currentSize,
        position: this.currentPosition,
        edge: this.state.edge,
        state: { ...this.state },
        originalEvent,
      };

      this.emit('resize:move', event);
    }
  }

  private applyResize(): void {
    if (!this.element) return;

    this.element.style.width = `${this.currentSize.width}px`;
    this.element.style.height = `${this.currentSize.height}px`;
    this.element.style.left = `${this.currentPosition.x}px`;
    this.element.style.top = `${this.currentPosition.y}px`;
  }

  private handleMouseUp: (e: MouseEvent) => void = (e: MouseEvent): void => {
    this.endResize(e);
  };

  private handleTouchEnd: (e: TouchEvent) => void = (e: TouchEvent): void => {
    this.endResize(e);
  };

  private endResize(originalEvent: MouseEvent | TouchEvent): void {
    if (!this.state.isResizing) return;

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

    this.state.isResizing = false;
    this.state.edge = null;

    const event: ResizeEvent = {
      type: 'end',
      size: this.currentSize,
      position: this.currentPosition,
      edge: this.state.edge,
      state: { ...this.state },
      originalEvent,
    };

    this.emit('resize:end', event);
  }

  cancelResize(): void {
    if (!this.state.isResizing) return;

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

    this.state.isResizing = false;
    this.state.edge = null;

    if (this.element) {
      this.element.style.width = `${this.startSize.width}px`;
      this.element.style.height = `${this.startSize.height}px`;
      this.element.style.left = `${this.startPosition.x}px`;
      this.element.style.top = `${this.startPosition.y}px`;

      this.currentSize = { ...this.startSize };
      this.currentPosition = { ...this.startPosition };
    }

    this.emit('resize:cancel', {
      type: 'cancel',
      size: this.currentSize,
      position: this.currentPosition,
      edge: null,
      state: { ...this.state },
      originalEvent: null as any,
    });
  }

  setSize(width: number, height: number): void {
    this.startSize = { width, height };
    this.currentSize = { width, height };

    if (this.element) {
      this.element.style.width = `${width}px`;
      this.element.style.height = `${height}px`;
    }
  }

  setSizeAnimated(width: number, height: number): void {
    if (!this.element) return;

    this.element.style.transition = `width ${this.config.animationDuration}ms ${this.config.animationEasing}, height ${this.config.animationDuration}ms ${this.config.animationEasing}`;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    setTimeout(() => {
      if (this.element) {
        this.element.style.transition = '';
      }
    }, this.config.animationDuration);

    this.currentSize = { width, height };
  }

  getSize(): ResizeSize {
    return { ...this.currentSize };
  }

  setPosition(x: number, y: number): void {
    this.startPosition = { x, y };
    this.currentPosition = { x, y };

    if (this.element) {
      this.element.style.left = `${x}px`;
      this.element.style.top = `${y}px`;
    }
  }

  getPosition(): ResizePosition {
    return { ...this.currentPosition };
  }

  getState(): ResizeState {
    return { ...this.state };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    this.handles.forEach((handle) => {
      handle.style.display = enabled ? 'block' : 'none';
    });

    this.emit('enabled:changed', enabled);
  }

  setConfig(config: Partial<ResizeConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.element) {
      this.handles.forEach((handle, edge) => {
        handle.style.cursor = this.getCursorForEdge(edge);
      });
    }

    this.emit('config:changed', this.config);
  }

  getConfig(): Required<ResizeConfig> {
    return { ...this.config };
  }

  setMinSize(width: number, height: number): void {
    this.config.minWidth = width;
    this.config.minHeight = height;
  }

  setMaxSize(width: number, height: number): void {
    this.config.maxWidth = width;
    this.config.maxHeight = height;
  }

  setAspectRatio(ratio: number): void {
    this.config.aspectRatio = ratio;
    this.config.lockAspectRatio = true;
  }

  lockAspectRatio(lock: boolean): void {
    this.config.lockAspectRatio = lock;
  }

  setBoundary(boundary: ResizeBoundary): void {
    this.config.boundary = boundary;
  }

  private updateElementSize(): void {
    if (!this.element) return;

    const rect = this.element.getBoundingClientRect();
    this.currentSize = { width: rect.width, height: rect.height };
    this.currentPosition = { x: rect.left, y: rect.top };
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

    this.removeAllListeners();
    this.emit('destroyed');
  }
}
