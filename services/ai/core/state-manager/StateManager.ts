/**
 * @file 状态管理器
 * @description 实现系统状态管理，支持状态持久化、快照、恢复等功能
 * @module state-manager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  NotFoundError,
  InternalError
} from '../error-handler/ErrorTypes';

export interface StateSnapshot {
  id: string;
  timestamp: number;
  state: any;
  metadata?: Record<string, any>;
}

export interface StateTransition {
  from: any;
  to: any;
  event: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface StateManagerConfig {
  enablePersistence?: boolean;
  enableSnapshots?: boolean;
  snapshotInterval?: number;
  maxSnapshots?: number;
  enableTransitions?: boolean;
  maxTransitions?: number;
}

export interface StateMetrics {
  totalTransitions: number;
  totalSnapshots: number;
  currentState: string;
  lastTransitionTime?: number;
  lastSnapshotTime?: number;
}

export class StateManager extends EventEmitter {
  private config: Required<StateManagerConfig>;
  private currentState: any;
  private previousState: any;
  private snapshots: StateSnapshot[] = [];
  private transitions: StateTransition[] = [];
  private snapshotInterval: NodeJS.Timeout | null = null;
  private metrics: StateMetrics;

  constructor(initialState: any, config: StateManagerConfig = {}) {
    super();
    this.currentState = initialState;
    this.previousState = null;
    this.config = {
      enablePersistence: config.enablePersistence ?? true,
      enableSnapshots: config.enableSnapshots ?? true,
      snapshotInterval: config.snapshotInterval ?? 60000,
      maxSnapshots: config.maxSnapshots ?? 10,
      enableTransitions: config.enableTransitions ?? true,
      maxTransitions: config.maxTransitions ?? 100,
    };
    this.metrics = {
      totalTransitions: 0,
      totalSnapshots: 0,
      currentState: JSON.stringify(initialState),
    };

    if (this.config.enableSnapshots) {
      this.startAutoSnapshot();
    }
  }

  getState(): any {
    return this.cloneState(this.currentState);
  }

  setState(newState: any, event: string = 'manual', metadata?: Record<string, any>): void {
    const previousState = this.cloneState(this.currentState);
    const nextState = this.cloneState(newState);

    if (this.config.enableTransitions) {
      this.recordTransition(previousState, nextState, event, metadata);
    }

    this.previousState = previousState;
    this.currentState = nextState;
    this.metrics.currentState = JSON.stringify(nextState);
    this.metrics.lastTransitionTime = Date.now();

    this.emit('state_changed', {
      previous: previousState,
      current: nextState,
      event,
      metadata,
    });

    if (this.config.enablePersistence) {
      this.persistState();
    }
  }

  updateState(updater: (state: any) => any, event: string = 'update', metadata?: Record<string, any>): void {
    const newState = updater(this.cloneState(this.currentState));
    this.setState(newState, event, metadata);
  }

  resetState(initialState?: any): void {
    const state = initialState ?? this.previousState ?? {};
    this.setState(state, 'reset', { reason: 'manual_reset' });
  }

  createSnapshot(metadata?: Record<string, any>): string {
    const snapshot: StateSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: Date.now(),
      state: this.cloneState(this.currentState),
      metadata,
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    this.metrics.totalSnapshots++;
    this.metrics.lastSnapshotTime = snapshot.timestamp;
    this.emit('snapshot_created', snapshot);

    if (this.config.enablePersistence) {
      this.persistSnapshot(snapshot);
    }

    return snapshot.id;
  }

  restoreSnapshot(snapshotId: string): void {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      throw new NotFoundError('snapshot', snapshotId);
    }

    this.setState(snapshot.state, 'restore', {
      snapshotId,
      snapshotTimestamp: snapshot.timestamp,
    });

    this.emit('snapshot_restored', snapshot);
  }

  deleteSnapshot(snapshotId: string): void {
    const index = this.snapshots.findIndex(s => s.id === snapshotId);
    if (index === -1) {
      throw new NotFoundError('snapshot', snapshotId, {
        additionalData: { availableSnapshots: this.snapshots.map(s => s.id) }
      });
    }

    this.snapshots.splice(index, 1);
    this.emit('snapshot_deleted', { snapshotId });
  }

  getSnapshot(snapshotId: string): StateSnapshot | undefined {
    return this.snapshots.find(s => s.id === snapshotId);
  }

  getSnapshots(limit?: number): StateSnapshot[] {
    const snapshots = [...this.snapshots].reverse();
    return limit ? snapshots.slice(0, limit) : snapshots;
  }

  getTransitions(limit?: number): StateTransition[] {
    const transitions = [...this.transitions].reverse();
    return limit ? transitions.slice(0, limit) : transitions;
  }

  getMetrics(): StateMetrics {
    return { ...this.metrics };
  }

  clearSnapshots(): void {
    this.snapshots = [];
    this.metrics.totalSnapshots = 0;
    this.emit('snapshots_cleared');
  }

  clearTransitions(): void {
    this.transitions = [];
    this.metrics.totalTransitions = 0;
    this.emit('transitions_cleared');
  }

  startAutoSnapshot(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }

    this.snapshotInterval = setInterval(() => {
      this.createSnapshot({ type: 'auto' });
    }, this.config.snapshotInterval);
  }

  stopAutoSnapshot(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  private recordTransition(
    from: any,
    to: any,
    event: string,
    metadata?: Record<string, any>
  ): void {
    const transition: StateTransition = {
      from: this.cloneState(from),
      to: this.cloneState(to),
      event,
      timestamp: Date.now(),
      metadata,
    };

    this.transitions.push(transition);

    if (this.transitions.length > this.config.maxTransitions) {
      this.transitions.shift();
    }

    this.metrics.totalTransitions++;
    this.emit('transition_recorded', transition);
  }

  private cloneState(state: any): any {
    if (state === null || typeof state !== 'object') {
      return state;
    }

    if (state instanceof Date) {
      return new Date(state.getTime());
    }

    if (Array.isArray(state)) {
      return state.map(item => this.cloneState(item));
    }

    const cloned = Array.isArray(state) ? [] : {};
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        cloned[key] = this.cloneState(state[key]);
      }
    }

    return cloned;
  }

  private persistState(): void {
    try {
      const stateData = {
        currentState: this.currentState,
        timestamp: Date.now(),
      };
      
      localStorage.setItem('yyc3_state', JSON.stringify(stateData));
    } catch (error) {
      console.error('[StateManager] Failed to persist state:', error);
    }
  }

  private persistSnapshot(snapshot: StateSnapshot): void {
    try {
      const snapshotsData = {
        snapshots: this.snapshots,
        timestamp: Date.now(),
      };
      
      localStorage.setItem('yyc3_snapshots', JSON.stringify(snapshotsData));
    } catch (error) {
      console.error('[StateManager] Failed to persist snapshots:', error);
    }
  }

  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.stopAutoSnapshot();
    this.clearSnapshots();
    this.clearTransitions();
    this.removeAllListeners();
  }
}

export default StateManager;
