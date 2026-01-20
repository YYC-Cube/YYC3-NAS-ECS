/**
 * @file 动画系统
 * @description 提供高性能动画支持，包括过渡动画、关键帧动画和缓动函数
 * @module ui/widget/AnimationSystem
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 * @updated 2026-01-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';

export type EasingFunction = (t: number) => number;

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction | string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface Keyframe {
  offset?: number;
  opacity?: number;
  transform?: string;
  backgroundColor?: string;
  color?: string;
  [key: string]: any;
}

export interface KeyframeAnimationConfig extends AnimationConfig {
  keyframes: Keyframe[];
}

export interface TransitionConfig {
  property: string;
  duration: number;
  easing: EasingFunction | string;
  delay?: number;
}

export interface AnimationState {
  id: string;
  type: 'transition' | 'keyframe' | 'custom';
  running: boolean;
  paused: boolean;
  completed: boolean;
  progress: number;
  startTime: number;
  pauseTime: number;
  currentIteration: number;
}

export interface AnimationMetrics {
  totalAnimations: number;
  runningAnimations: number;
  completedAnimations: number;
  failedAnimations: number;
  averageDuration: number;
  totalDuration: number;
}

export interface AnimationSystemConfig {
  enabled?: boolean;
  defaultDuration?: number;
  defaultEasing?: EasingFunction | string;
  maxConcurrentAnimations?: number;
  enablePerformanceMonitoring?: boolean;
  enableAutoCleanup?: boolean;
  cleanupDelay?: number;
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame?: (id: number) => void;
}

export class AnimationSystem extends EventEmitter {
  private config: Required<AnimationSystemConfig>;
  private animations: Map<string, AnimationState>;
  private rafCallbacks: Map<string, number>;
  private elementAnimations: WeakMap<HTMLElement, Set<string>>;
  private metrics: AnimationMetrics;
  private enabled: boolean;
  private maxConcurrent: number;
  private performanceMonitoring: boolean;
  private autoCleanup: boolean;
  private cleanupDelay: number;
  private requestAnimationFrame: (callback: FrameRequestCallback) => number;
  private cancelAnimationFrame: (id: number) => void;

  constructor(config: AnimationSystemConfig = {}) {
    super();

    this.config = {
      enabled: true,
      defaultDuration: 300,
      defaultEasing: 'ease-out',
      maxConcurrentAnimations: 50,
      enablePerformanceMonitoring: true,
      enableAutoCleanup: true,
      cleanupDelay: 5000,
      requestAnimationFrame: typeof window !== 'undefined' 
        ? window.requestAnimationFrame.bind(window) 
        : (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number,
      cancelAnimationFrame: typeof window !== 'undefined' 
        ? window.cancelAnimationFrame.bind(window) 
        : (id: number) => clearTimeout(id),
      ...config,
    };

    this.animations = new Map();
    this.rafCallbacks = new Map();
    this.elementAnimations = new WeakMap();
    this.metrics = {
      totalAnimations: 0,
      runningAnimations: 0,
      completedAnimations: 0,
      failedAnimations: 0,
      averageDuration: 0,
      totalDuration: 0,
    };
    this.enabled = this.config.enabled;
    this.maxConcurrent = this.config.maxConcurrentAnimations;
    this.performanceMonitoring = this.config.enablePerformanceMonitoring;
    this.autoCleanup = this.config.enableAutoCleanup;
    this.cleanupDelay = this.config.cleanupDelay;
    this.requestAnimationFrame = this.config.requestAnimationFrame;
    this.cancelAnimationFrame = this.config.cancelAnimationFrame;
  }

  enable(): void {
    this.enabled = true;
    this.emit('enabled');
  }

  disable(): void {
    this.enabled = false;
    this.cancelAllAnimations();
    this.emit('disabled');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  animate(
    element: HTMLElement,
    config: KeyframeAnimationConfig,
    id?: string
  ): string {
    if (!this.enabled) {
      return '';
    }

    const animationId = id || `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const state: AnimationState = {
      id: animationId,
      type: 'keyframe',
      running: false,
      paused: false,
      completed: false,
      progress: 0,
      startTime: 0,
      pauseTime: 0,
      currentIteration: 0,
    };

    this.animations.set(animationId, state);
    this.trackElementAnimation(element, animationId);

    const easing = this.parseEasing(config.easing || this.config.defaultEasing);
    const duration = config.duration || this.config.defaultDuration;
    const delay = config.delay || 0;
    const iterations = config.iterations || 1;
    const direction = config.direction || 'normal';
    const fillMode = config.fillMode || 'forwards';

    this.metrics.totalAnimations++;
    this.metrics.totalDuration += duration;

    const startTime = performance.now() + delay;

    const animate = (timestamp: number) => {
      if (!this.animations.has(animationId)) return;

      const state = this.animations.get(animationId)!;

      if (timestamp < startTime) {
        this.rafCallbacks.set(animationId, this.requestAnimationFrame(animate));
        return;
      }

      if (!state.running) {
        state.running = true;
        this.metrics.runningAnimations++;
        this.emit('animation:started', animationId);
      }

      if (state.paused) {
        state.pauseTime = timestamp;
        return;
      }

      const elapsed = timestamp - startTime;
      const totalDuration = duration * iterations;
      const progress = Math.min(elapsed / duration, 1);
      const currentIteration = Math.floor(elapsed / duration);

      state.progress = progress;
      state.currentIteration = currentIteration;

      const easedProgress = easing(progress);
      const keyframeIndex = Math.floor(easedProgress * (config.keyframes.length - 1));
      const keyframeProgress = (easedProgress * (config.keyframes.length - 1)) % 1;

      const startKeyframe = config.keyframes[keyframeIndex];
      const endKeyframe = config.keyframes[Math.min(keyframeIndex + 1, config.keyframes.length - 1)];

      this.applyKeyframe(element, startKeyframe, endKeyframe, keyframeProgress);

      if (progress < 1 || currentIteration < iterations - 1) {
        this.rafCallbacks.set(animationId, this.requestAnimationFrame(animate));
      } else {
        this.completeAnimation(animationId, element, fillMode);
      }
    };

    this.rafCallbacks.set(animationId, this.requestAnimationFrame(animate));

    return animationId;
  }

  transition(
    element: HTMLElement,
    from: Record<string, any>,
    to: Record<string, any>,
    config: TransitionConfig,
    id?: string
  ): string {
    if (!this.enabled) {
      return '';
    }

    const animationId = id || `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const state: AnimationState = {
      id: animationId,
      type: 'transition',
      running: false,
      paused: false,
      completed: false,
      progress: 0,
      startTime: 0,
      pauseTime: 0,
      currentIteration: 0,
    };

    this.animations.set(animationId, state);
    this.trackElementAnimation(element, animationId);

    const easing = this.parseEasing(config.easing || this.config.defaultEasing);
    const duration = config.duration || this.config.defaultDuration;
    const delay = config.delay || 0;

    this.metrics.totalAnimations++;
    this.metrics.totalDuration += duration;

    const startTime = performance.now() + delay;

    const animate = (timestamp: number) => {
      if (!this.animations.has(animationId)) return;

      const state = this.animations.get(animationId)!;

      if (timestamp < startTime) {
        this.rafCallbacks.set(animationId, this.requestAnimationFrame(animate));
        return;
      }

      if (!state.running) {
        state.running = true;
        this.metrics.runningAnimations++;
        this.emit('animation:started', animationId);
      }

      if (state.paused) {
        state.pauseTime = timestamp;
        return;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      state.progress = progress;
      const easedProgress = easing(progress);

      for (const property in to) {
        const fromValue = from[property];
        const toValue = to[property];
        const interpolatedValue = this.interpolate(fromValue, toValue, easedProgress);
        this.applyProperty(element, property, interpolatedValue);
      }

      if (progress < 1) {
        this.rafCallbacks.set(animationId, this.requestAnimationFrame(animate));
      } else {
        this.completeAnimation(animationId, element, 'forwards');
      }
    };

    this.rafCallbacks.set(animationId, this.requestAnimationFrame(animate));

    return animationId;
  }

  pause(animationId: string): void {
    const state = this.animations.get(animationId);
    if (state && state.running && !state.paused) {
      state.paused = true;
      this.emit('animation:paused', animationId);
    }
  }

  resume(animationId: string): void {
    const state = this.animations.get(animationId);
    if (state && state.running && state.paused) {
      state.paused = false;
      const rafId = this.rafCallbacks.get(animationId);
      if (rafId) {
        this.cancelAnimationFrame(rafId);
      }
      this.emit('animation:resumed', animationId);
    }
  }

  cancel(animationId: string): void {
    const state = this.animations.get(animationId);
    if (state) {
      const rafId = this.rafCallbacks.get(animationId);
      if (rafId) {
        this.cancelAnimationFrame(rafId);
        this.rafCallbacks.delete(animationId);
      }

      this.animations.delete(animationId);
      this.metrics.runningAnimations--;
      this.metrics.failedAnimations++;
      this.emit('animation:cancelled', animationId);

      if (this.autoCleanup) {
        this.scheduleCleanup(animationId);
      }
    }
  }

  cancelAllAnimations(): void {
    const animationIds = Array.from(this.animations.keys());
    animationIds.forEach(id => this.cancel(id));
  }

  getAnimationState(animationId: string): AnimationState | undefined {
    return this.animations.get(animationId);
  }

  isRunning(animationId: string): boolean {
    const state = this.animations.get(animationId);
    return state?.running && !state.paused ? true : false;
  }

  isPaused(animationId: string): boolean {
    const state = this.animations.get(animationId);
    return state?.paused ? true : false;
  }

  isCompleted(animationId: string): boolean {
    const state = this.animations.get(animationId);
    return state?.completed ? true : false;
  }

  getMetrics(): AnimationMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalAnimations: 0,
      runningAnimations: 0,
      completedAnimations: 0,
      failedAnimations: 0,
      averageDuration: 0,
      totalDuration: 0,
    };
  }

  private completeAnimation(
    animationId: string,
    element: HTMLElement,
    fillMode: string
  ): void {
    const state = this.animations.get(animationId);
    if (!state) return;

    state.running = false;
    state.completed = true;
    state.progress = 1;

    this.metrics.runningAnimations--;
    this.metrics.completedAnimations++;

    if (fillMode === 'backwards' || fillMode === 'both') {
      const rafId = this.rafCallbacks.get(animationId);
      if (rafId) {
        this.cancelAnimationFrame(rafId);
        this.rafCallbacks.delete(animationId);
      }
    }

    this.emit('animation:completed', animationId);

    if (this.autoCleanup) {
      this.scheduleCleanup(animationId);
    }
  }

  private scheduleCleanup(animationId: string): void {
    setTimeout(() => {
      this.animations.delete(animationId);
    }, this.cleanupDelay);
  }

  private trackElementAnimation(element: HTMLElement, animationId: string): void {
    let animations = this.elementAnimations.get(element);
    if (!animations) {
      animations = new Set();
      this.elementAnimations.set(element, animations);
    }
    animations.add(animationId);
  }

  private applyKeyframe(
    element: HTMLElement,
    startKeyframe: Keyframe,
    endKeyframe: Keyframe,
    progress: number
  ): void {
    const properties = new Set([
      ...Object.keys(startKeyframe),
      ...Object.keys(endKeyframe),
    ]);

    properties.forEach(property => {
      if (property === 'offset') return;

      const startValue = startKeyframe[property];
      const endValue = endKeyframe[property];

      if (startValue !== undefined && endValue !== undefined) {
        const interpolatedValue = this.interpolate(startValue, endValue, progress);
        this.applyProperty(element, property, interpolatedValue);
      } else if (endValue !== undefined) {
        this.applyProperty(element, property, endValue);
      }
    });
  }

  private applyProperty(element: HTMLElement, property: string, value: any): void {
    switch (property) {
      case 'opacity':
        element.style.opacity = value.toString();
        break;
      case 'transform':
        element.style.transform = value;
        break;
      case 'backgroundColor':
      case 'color':
        element.style[property] = value;
        break;
      default:
        if (typeof value === 'number') {
          element.style[property] = `${value}px`;
        } else {
          element.style[property] = value;
        }
    }
  }

  private interpolate(from: any, to: any, progress: number): any {
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }

    if (typeof from === 'string' && typeof to === 'string') {
      const fromColor = this.parseColor(from);
      const toColor = this.parseColor(to);

      if (fromColor && toColor) {
        const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * progress);
        const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * progress);
        const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * progress);
        const a = fromColor.a + (toColor.a - fromColor.a) * progress;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
    }

    return progress < 0.5 ? from : to;
  }

  private parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/;
    const match = color.match(rgbaRegex);

    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }

    return null;
  }

  private parseEasing(easing: EasingFunction | string): EasingFunction {
    if (typeof easing === 'function') {
      return easing;
    }

    const easingFunctions: Record<string, EasingFunction> = {
      linear: t => t,
      ease: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      'ease-in': t => t * t,
      'ease-out': t => t * (2 - t),
      'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      'ease-in-cubic': t => t * t * t,
      'ease-out-cubic': t => --t * t * t + 1,
      'ease-in-out-cubic': t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      'ease-in-quart': t => t * t * t * t,
      'ease-out-quart': t => 1 - --t * t * t * t,
      'ease-in-out-quart': t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
      'ease-in-quint': t => t * t * t * t * t,
      'ease-out-quint': t => 1 + --t * t * t * t * t,
      'ease-in-out-quint': t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
      'ease-in-expo': t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
      'ease-out-expo': t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      'ease-in-out-expo': t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
      'ease-in-circ': t => t === 0 ? 0 : 1 - Math.sqrt(1 - t * t),
      'ease-out-circ': t => t === 1 ? 1 : Math.sqrt(1 - --t * t),
      'ease-in-out-circ': t => t < 0.5 ? (1 - Math.sqrt(1 - 2 * t * t)) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
      'ease-in-back': t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
      },
      'ease-out-back': t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      },
      'ease-in-out-back': t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
      },
      'ease-in-elastic': t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      },
      'ease-out-elastic': t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
      'ease-in-out-elastic': t => {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
      },
      'ease-in-bounce': t => 1 - this.easeOutBounce(1 - t),
      'ease-out-bounce': t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      },
      'ease-in-out-bounce': t => t < 0.5
        ? (1 - this.easeOutBounce(1 - 2 * t)) / 2
        : (1 + this.easeOutBounce(2 * t - 1)) / 2,
    };

    return easingFunctions[easing] || easingFunctions.linear;
  }

  private easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  destroy(): void {
    this.cancelAllAnimations();
    this.removeAllListeners();
    this.animations.clear();
    this.rafCallbacks.clear();
    this.resetMetrics();
  }
}
