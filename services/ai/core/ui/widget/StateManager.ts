/**
 * @file 状态管理系统
 * @description 统一的状态管理、状态同步和状态持久化系统
 * @module core/ui/widget/StateManager
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 * @updated 2026-01-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';

export interface StateManagerConfig {
  enabled?: boolean;
  enablePersistence?: boolean;
  enableSync?: boolean;
  enableValidation?: boolean;
  enableOptimization?: boolean;
  persistenceKey?: string;
  syncInterval?: number;
  maxStateHistory?: number;
  stateRetentionDays?: number;
  onStateChange?: (state: StateSnapshot) => void;
  onStateRestored?: (state: StateSnapshot) => void;
  onStateSynced?: (state: StateSnapshot) => void;
}

export type RequiredStateManagerConfig = {
  enabled: boolean;
  enablePersistence: boolean;
  enableSync: boolean;
  enableValidation: boolean;
  enableOptimization: boolean;
  persistenceKey: string;
  syncInterval: number;
  maxStateHistory: number;
  stateRetentionDays: number;
  onStateChange: (state: StateSnapshot) => void;
  onStateRestored: (state: StateSnapshot) => void;
  onStateSynced: (state: StateSnapshot) => void;
};

export interface StateSnapshot {
  id: string;
  timestamp: number;
  version: string;
  data: Record<string, any>;
  metadata: StateMetadata;
  checksum: string;
}

export interface StateMetadata {
  source: string;
  component: string;
  tags: string[];
  priority: number;
  expiresAt?: number;
}

export interface StateTransition {
  from: StateSnapshot;
  to: StateSnapshot;
  timestamp: number;
  action: string;
  actor: string;
  metadata: Record<string, any>;
}

export interface StateValidationResult {
  valid: boolean;
  errors: StateValidationError[];
  warnings: StateValidationWarning[];
}

export interface StateValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error';
}

export interface StateValidationWarning {
  path: string;
  message: string;
  code: string;
  severity: 'warning';
}

export interface StateMetrics {
  totalStates: number;
  totalTransitions: number;
  totalRestores: number;
  totalSyncs: number;
  averageStateSize: number;
  averageTransitionTime: number;
  lastStateChange: number;
  lastSyncTime: number;
  stateChangeRate: number;
}

export interface StateSchema {
  version: string;
  properties: Record<string, PropertySchema>;
  required?: string[];
  defaults?: Record<string, any>;
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
  transform?: (value: any) => any;
}

export interface StateDiff {
  added: Record<string, any>;
  removed: string[];
  modified: Record<string, { from: any; to: any }>;
  unchanged: string[];
}

export class StateManager extends EventEmitter {
  private config: RequiredStateManagerConfig;
  private currentState: StateSnapshot;
  private stateHistory: StateSnapshot[];
  private transitions: StateTransition[];
  private schemas: Map<string, StateSchema>;
  private metrics: StateMetrics;
  private enabled: boolean;
  private persistenceEnabled: boolean;
  private syncEnabled: boolean;
  private validationEnabled: boolean;
  private optimizationEnabled: boolean;
  private persistenceKey: string;
  private syncInterval: number;
  private maxStateHistory: number;
  private stateRetentionDays: number;
  private syncTimer: NodeJS.Timeout | null;
  private stateVersion: string;

  constructor(initialState: Record<string, any> = {}, config: StateManagerConfig = {}) {
    super();

    const defaultCallbacks = {
      onStateChange: (_state: StateSnapshot) => {},
      onStateRestored: (_state: StateSnapshot) => {},
      onStateSynced: (_state: StateSnapshot) => {},
    };

    this.config = {
      enabled: true,
      enablePersistence: true,
      enableSync: false,
      enableValidation: true,
      enableOptimization: true,
      persistenceKey: 'yyc3-widget-state',
      syncInterval: 60000,
      maxStateHistory: 100,
      stateRetentionDays: 7,
      ...defaultCallbacks,
      ...config,
    } as RequiredStateManagerConfig;

    this.stateVersion = '1.0.0';
    this.currentState = this.createInitialState(initialState);
    this.stateHistory = [this.currentState];
    this.transitions = [];
    this.schemas = new Map();
    this.syncTimer = null;

    this.metrics = {
      totalStates: 1,
      totalTransitions: 0,
      totalRestores: 0,
      totalSyncs: 0,
      averageStateSize: 0,
      averageTransitionTime: 0,
      lastStateChange: Date.now(),
      lastSyncTime: 0,
      stateChangeRate: 0,
    };

    this.enabled = this.config.enabled;
    this.persistenceEnabled = this.config.enablePersistence;
    this.syncEnabled = this.config.enableSync;
    this.validationEnabled = this.config.enableValidation;
    this.optimizationEnabled = this.config.enableOptimization;
    this.persistenceKey = this.config.persistenceKey;
    this.syncInterval = this.config.syncInterval;
    this.maxStateHistory = this.config.maxStateHistory;
    this.stateRetentionDays = this.config.stateRetentionDays;

    this.initialize();
  }

  private initialize(): void {
    this.loadPersistedState();

    if (this.syncEnabled) {
      this.startSync();
    }

    this.startStateCleanup();
  }

  private createInitialState(data: Record<string, any>): StateSnapshot {
    return {
      id: this.generateStateId(),
      timestamp: Date.now(),
      version: this.stateVersion,
      data: { ...data },
      metadata: {
        source: 'initial',
        component: 'StateManager',
        tags: ['initial'],
        priority: 0,
      },
      checksum: this.calculateChecksum(data),
    };
  }

  private loadPersistedState(): void {
    if (!this.persistenceEnabled) {
      return;
    }

    try {
      const persistedState = localStorage.getItem(this.persistenceKey);

      if (persistedState) {
        const state = JSON.parse(persistedState) as StateSnapshot;

        const validation = this.validateState(state);

        if (validation.valid) {
          this.currentState = state;
          this.stateHistory = [state];
          this.metrics.totalRestores++;

          this.emit('state:restored', state);

          if (this.config.onStateRestored) {
            this.config.onStateRestored(state);
          }
        } else {
          console.warn('Persisted state validation failed:', validation.errors);
        }
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  private persistState(): void {
    if (!this.persistenceEnabled) {
      return;
    }

    try {
      const stateToPersist = this.optimizeState(this.currentState);
      localStorage.setItem(this.persistenceKey, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  private startSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncState();
    }, this.syncInterval);
  }

  private stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private startStateCleanup(): void {
    setInterval(() => {
      this.cleanupOldStates();
    }, 3600000);
  }

  private cleanupOldStates(): void {
    const cutoffTime = Date.now() - (this.stateRetentionDays * 24 * 60 * 60 * 1000);

    this.stateHistory = this.stateHistory.filter(state => state.timestamp > cutoffTime);
    this.transitions = this.transitions.filter(transition => transition.timestamp > cutoffTime);
  }

  public getState(): Record<string, any> {
    return { ...this.currentState.data };
  }

  public getStateSnapshot(): StateSnapshot {
    return { ...this.currentState };
  }

  public setState(
    newData: Partial<Record<string, any>>,
    options: {
      merge?: boolean;
      validate?: boolean;
      persist?: boolean;
      metadata?: Partial<StateMetadata>;
    } = {}
  ): StateSnapshot {
    if (!this.enabled) {
      return this.currentState;
    }

    const {
      merge = true,
      validate = this.validationEnabled,
      persist = this.persistenceEnabled,
      metadata = {},
    } = options;

    const previousState = { ...this.currentState };
    const newDataToApply = merge ? { ...this.currentState.data, ...newData } : newData;

    if (validate) {
      const validation = this.validateData(newDataToApply);

      if (!validation.valid) {
        throw new Error(`State validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    const newState: StateSnapshot = {
      id: this.generateStateId(),
      timestamp: Date.now(),
      version: this.stateVersion,
      data: newDataToApply,
      metadata: {
        source: 'setState',
        component: metadata.component || 'StateManager',
        tags: metadata.tags || [],
        priority: metadata.priority || 0,
        expiresAt: metadata.expiresAt,
      },
      checksum: this.calculateChecksum(newDataToApply),
    };

    const transition: StateTransition = {
      from: previousState,
      to: newState,
      timestamp: Date.now(),
      action: 'setState',
      actor: 'user',
      metadata: options.metadata || {},
    };

    this.currentState = newState;
    this.stateHistory.push(newState);
    this.transitions.push(transition);

    this.updateMetrics(newState, transition);

    if (persist) {
      this.persistState();
    }

    this.emit('state:changed', newState, previousState);

    if (this.config.onStateChange) {
      this.config.onStateChange(newState);
    }

    return newState;
  }

  public updateState(
    path: string,
    value: any,
    options: {
      validate?: boolean;
      persist?: boolean;
    } = {}
  ): StateSnapshot {
    const { validate = this.validationEnabled, persist = this.persistenceEnabled } = options;

    const newData = this.getNestedValue(this.currentState.data, path);
    const updatedData = this.setNestedValue({ ...this.currentState.data }, path, value);

    return this.setState(updatedData, { merge: false, validate, persist });
  }

  public patchState(
    updates: Record<string, any>,
    options: {
      validate?: boolean;
      persist?: boolean;
    } = {}
  ): StateSnapshot {
    return this.setState(updates, { merge: true, ...options });
  }

  public resetState(defaultState?: Record<string, any>): StateSnapshot {
    const data = defaultState || {};
    return this.setState(data, { merge: false });
  }

  public restoreState(stateId: string): StateSnapshot | null {
    const stateToRestore = this.stateHistory.find(state => state.id === stateId);

    if (!stateToRestore) {
      return null;
    }

    const validation = this.validateState(stateToRestore);

    if (!validation.valid) {
      throw new Error(`Cannot restore invalid state: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const previousState = { ...this.currentState };

    const transition: StateTransition = {
      from: previousState,
      to: stateToRestore,
      timestamp: Date.now(),
      action: 'restoreState',
      actor: 'system',
      metadata: { restoredFrom: stateId },
    };

    this.currentState = stateToRestore;
    this.transitions.push(transition);

    this.metrics.totalRestores++;

    this.persistState();

    this.emit('state:restored', stateToRestore);

    if (this.config.onStateRestored) {
      this.config.onStateRestored(stateToRestore);
    }

    return stateToRestore;
  }

  public undo(): StateSnapshot | null {
    if (this.stateHistory.length < 2) {
      return null;
    }

    const currentIndex = this.stateHistory.length - 1;
    const previousState = this.stateHistory[currentIndex - 1];

    return this.restoreState(previousState.id);
  }

  public redo(): StateSnapshot | null {
    return null;
  }

  public getStateHistory(limit?: number): StateSnapshot[] {
    const history = [...this.stateHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  public getTransitions(limit?: number): StateTransition[] {
    const transitions = [...this.transitions].reverse();
    return limit ? transitions.slice(0, limit) : transitions;
  }

  public compareStates(state1: StateSnapshot, state2: StateSnapshot): StateDiff {
    const diff: StateDiff = {
      added: {},
      removed: [],
      modified: {},
      unchanged: [],
    };

    const keys1 = Object.keys(state1.data);
    const keys2 = Object.keys(state2.data);

    keys2.forEach(key => {
      if (!keys1.includes(key)) {
        diff.added[key] = state2.data[key];
      }
    });

    keys1.forEach(key => {
      if (!keys2.includes(key)) {
        diff.removed.push(key);
      }
    });

    keys1.forEach(key => {
      if (keys2.includes(key)) {
        const value1 = state1.data[key];
        const value2 = state2.data[key];

        if (JSON.stringify(value1) !== JSON.stringify(value2)) {
          diff.modified[key] = { from: value1, to: value2 };
        } else {
          diff.unchanged.push(key);
        }
      }
    });

    return diff;
  }

  public validateData(data: Record<string, any>): StateValidationResult {
    const errors: StateValidationError[] = [];
    const warnings: StateValidationWarning[] = [];

    this.schemas.forEach((schema, name) => {
      const schemaErrors = this.validateAgainstSchema(data, schema);
      errors.push(...schemaErrors);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public validateState(state: StateSnapshot): StateValidationResult {
    const errors: StateValidationError[] = [];
    const warnings: StateValidationWarning[] = [];

    if (!state.id || typeof state.id !== 'string') {
      errors.push({
        path: 'id',
        message: 'State ID is required and must be a string',
        code: 'INVALID_ID',
        severity: 'error',
      });
    }

    if (!state.timestamp || typeof state.timestamp !== 'number') {
      errors.push({
        path: 'timestamp',
        message: 'State timestamp is required and must be a number',
        code: 'INVALID_TIMESTAMP',
        severity: 'error',
      });
    }

    if (!state.version || typeof state.version !== 'string') {
      errors.push({
        path: 'version',
        message: 'State version is required and must be a string',
        code: 'INVALID_VERSION',
        severity: 'error',
      });
    }

    if (!state.data || typeof state.data !== 'object') {
      errors.push({
        path: 'data',
        message: 'State data is required and must be an object',
        code: 'INVALID_DATA',
        severity: 'error',
      });
    } else {
      const dataValidation = this.validateData(state.data);
      errors.push(...dataValidation.errors);
      warnings.push(...dataValidation.warnings);
    }

    const calculatedChecksum = this.calculateChecksum(state.data);
    if (state.checksum !== calculatedChecksum) {
      errors.push({
        path: 'checksum',
        message: 'State checksum mismatch',
        code: 'CHECKSUM_MISMATCH',
        severity: 'error',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateAgainstSchema(data: Record<string, any>, schema: StateSchema): StateValidationError[] {
    const errors: StateValidationError[] = [];

    schema.required?.forEach(property => {
      if (!(property in data)) {
        errors.push({
          path: property,
          message: `Required property '${property}' is missing`,
          code: 'REQUIRED_PROPERTY_MISSING',
          severity: 'error',
        });
      }
    });

    Object.entries(schema.properties).forEach(([key, propertySchema]) => {
      const value = data[key];

      if (value === undefined || value === null) {
        if (propertySchema.required) {
          errors.push({
            path: key,
            message: `Property '${key}' is required`,
            code: 'REQUIRED_PROPERTY',
            severity: 'error',
          });
        }
        return;
      }

      if (!this.validateType(value, propertySchema.type)) {
        errors.push({
          path: key,
          message: `Property '${key}' must be of type '${propertySchema.type}'`,
          code: 'INVALID_TYPE',
          severity: 'error',
        });
      }

      if (propertySchema.validator && !propertySchema.validator(value)) {
        errors.push({
          path: key,
          message: `Property '${key}' failed custom validation`,
          code: 'VALIDATION_FAILED',
          severity: 'error',
        });
      }
    });

    return errors;
  }

  private validateType(value: any, type: PropertySchema['type']): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return true;
    }
  }

  public registerSchema(name: string, schema: StateSchema): void {
    this.schemas.set(name, schema);
  }

  public unregisterSchema(name: string): void {
    this.schemas.delete(name);
  }

  public getSchema(name: string): StateSchema | undefined {
    return this.schemas.get(name);
  }

  private async syncState(): Promise<void> {
    if (!this.syncEnabled) {
      return;
    }

    try {
      this.metrics.totalSyncs++;
      this.metrics.lastSyncTime = Date.now();

      this.emit('state:synced', this.currentState);

      if (this.config.onStateSynced) {
        this.config.onStateSynced(this.currentState);
      }
    } catch (error) {
      console.error('Failed to sync state:', error);
    }
  }

  private updateMetrics(newState: StateSnapshot, transition: StateTransition): void {
    this.metrics.totalStates++;
    this.metrics.totalTransitions++;
    this.metrics.lastStateChange = Date.now();

    const stateSize = JSON.stringify(newState.data).length;
    this.metrics.averageStateSize =
      (this.metrics.averageStateSize * (this.metrics.totalStates - 1) + stateSize) / this.metrics.totalStates;

    const transitionTime = transition.timestamp - transition.from.timestamp;
    this.metrics.averageTransitionTime =
      (this.metrics.averageTransitionTime * (this.metrics.totalTransitions - 1) + transitionTime) / this.metrics.totalTransitions;

    this.metrics.stateChangeRate = this.calculateStateChangeRate();
  }

  private calculateStateChangeRate(): number {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const recentTransitions = this.transitions.filter(t => t.timestamp > oneHourAgo);
    return recentTransitions.length;
  }

  private optimizeState(state: StateSnapshot): StateSnapshot {
    if (!this.optimizationEnabled) {
      return state;
    }

    return {
      ...state,
      data: this.removeUndefinedValues(state.data),
    };
  }

  private removeUndefinedValues(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }

    const result: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = this.removeUndefinedValues(value);
      }
    });

    return result;
  }

  private calculateChecksum(data: Record<string, any>): string {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): any {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
    return obj;
  }

  public getMetrics(): StateMetrics {
    return { ...this.metrics };
  }

  public exportState(): string {
    return JSON.stringify(this.currentState, null, 2);
  }

  public importState(stateJson: string): StateSnapshot {
    try {
      const state = JSON.parse(stateJson) as StateSnapshot;

      const validation = this.validateState(state);

      if (!validation.valid) {
        throw new Error(`Invalid state: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      return this.restoreState(state.id) || this.setState(state.data, { merge: false });
    } catch (error) {
      throw new Error(`Failed to import state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public clearHistory(): void {
    this.stateHistory = [this.currentState];
    this.transitions = [];
  }

  public enable(): void {
    this.enabled = true;
    this.emit('enabled');
  }

  public disable(): void {
    this.enabled = false;
    this.emit('disabled');
  }

  public enablePersistence(): void {
    this.persistenceEnabled = true;
    this.persistState();
  }

  public disablePersistence(): void {
    this.persistenceEnabled = false;
    localStorage.removeItem(this.persistenceKey);
  }

  public enableSync(): void {
    this.syncEnabled = true;
    this.startSync();
  }

  public disableSync(): void {
    this.syncEnabled = false;
    this.stopSync();
  }

  private generateStateId(): string {
    return `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.stopSync();
    this.clearHistory();
    this.removeAllListeners();
  }
}
