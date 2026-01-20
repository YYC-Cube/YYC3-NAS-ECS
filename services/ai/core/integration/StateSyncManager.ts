import { EventEmitter } from 'events';

export interface SyncOptions {
  conflictStrategy?: 'last_write_wins' | 'merge' | 'manual';
  syncMode?: 'immediate' | 'scheduled' | 'manual';
  priority?: 'low' | 'normal' | 'high';
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  duration: number;
  conflict?: Conflict;
  resolvedState?: any;
}

export interface Conflict {
  type: string;
  currentVersion: number;
  newVersion: number;
  currentState: any;
  newState: any;
}

export interface SyncHistoryRecord {
  syncId: string;
  sourceModule: string;
  targetModule: string;
  conflict?: Conflict;
  resolvedState: any;
  timestamp: Date;
}

export interface StateSyncMetrics {
  syncId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  conflict: boolean;
  success: boolean;
}

export interface StateSyncErrorMetrics {
  syncId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  error: string;
}

export class StateSyncError extends Error {
  constructor(message: string, public metadata: any) {
    super(message);
    this.name = 'StateSyncError';
  }
}

export class StateStore {
  private store: Map<string, any> = new Map();

  async get(key: string): Promise<any> {
    return this.store.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getAll(): Promise<Map<string, any>> {
    return new Map(this.store);
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

export class ConflictResolver {
  async resolve(
    currentState: any,
    newState: any,
    strategy: 'last_write_wins' | 'merge' | 'manual' = 'last_write_wins'
  ): Promise<any> {
    switch (strategy) {
      case 'last_write_wins':
        return this.resolveLastWriteWins(currentState, newState);
      
      case 'merge':
        return await this.resolveMerge(currentState, newState);
      
      case 'manual':
        return await this.resolveManual(currentState, newState);
      
      default:
        throw new Error(`未知的冲突解决策略: ${strategy}`);
    }
  }

  private resolveLastWriteWins(currentState: any, newState: any): any {
    return newState;
  }

  private async resolveMerge(currentState: any, newState: any): Promise<any> {
    const merged = { ...currentState };

    for (const key in newState) {
      if (typeof newState[key] === 'object' && !Array.isArray(newState[key])) {
        merged[key] = await this.resolveMerge(currentState[key] || {}, newState[key]);
      } else {
        merged[key] = newState[key];
      }
    }

    return merged;
  }

  private async resolveManual(currentState: any, newState: any): Promise<any> {
    throw new Error('手动冲突解决需要人工干预');
  }
}

export class SyncScheduler {
  private scheduledSyncs: Map<string, NodeJS.Timeout> = new Map();
  private eventBus: EventEmitter;

  constructor(eventBus: EventEmitter) {
    this.eventBus = eventBus;
  }

  scheduleSync(
    syncId: string,
    syncFn: () => Promise<void>,
    delay: number
  ): void {
    const timeout = setTimeout(async () => {
      try {
        await syncFn();
        this.scheduledSyncs.delete(syncId);
      } catch (error) {
        this.eventBus.emit('sync:error', { syncId, error });
      }
    }, delay);

    this.scheduledSyncs.set(syncId, timeout);
  }

  cancelSync(syncId: string): void {
    const timeout = this.scheduledSyncs.get(syncId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledSyncs.delete(syncId);
    }
  }

  cancelAllSyncs(): void {
    for (const [syncId, timeout] of this.scheduledSyncs.entries()) {
      clearTimeout(timeout);
    }
    this.scheduledSyncs.clear();
  }
}

export class MonitoringService {
  private syncMetrics: StateSyncMetrics[] = [];
  private syncErrors: StateSyncErrorMetrics[] = [];

  recordStateSync(metrics: StateSyncMetrics): void {
    this.syncMetrics.push(metrics);
    
    if (this.syncMetrics.length > 1000) {
      this.syncMetrics = this.syncMetrics.slice(-1000);
    }
  }

  recordStateSyncError(metrics: StateSyncErrorMetrics): void {
    this.syncErrors.push(metrics);
    
    if (this.syncErrors.length > 1000) {
      this.syncErrors = this.syncErrors.slice(-1000);
    }
  }

  getMetrics(): {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflictRate: number;
    averageDuration: number;
  } {
    const totalSyncs = this.syncMetrics.length;
    const successfulSyncs = this.syncMetrics.filter(m => m.success).length;
    const failedSyncs = this.syncErrors.length;
    const conflictRate = totalSyncs > 0
      ? this.syncMetrics.filter(m => m.conflict).length / totalSyncs
      : 0;
    const averageDuration = totalSyncs > 0
      ? this.syncMetrics.reduce((sum, m) => sum + m.duration, 0) / totalSyncs
      : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      conflictRate,
      averageDuration
    };
  }

  clear(): void {
    this.syncMetrics = [];
    this.syncErrors = [];
  }
}

export class StateSyncManager {
  private stateStore: StateStore;
  private conflictResolver: ConflictResolver;
  private syncScheduler: SyncScheduler;
  private monitoring: MonitoringService;
  private eventBus: EventEmitter;

  constructor() {
    this.stateStore = new StateStore();
    this.conflictResolver = new ConflictResolver();
    this.eventBus = new EventEmitter();
    this.syncScheduler = new SyncScheduler(this.eventBus);
    this.monitoring = new MonitoringService();
  }

  async syncState(
    sourceModule: string,
    targetModule: string,
    state: any,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const syncId = this.generateSyncId();

    try {
      const targetState = await this.stateStore.get(targetModule);

      const conflict = await this.detectConflict(targetState, state);

      let resolvedState = state;
      if (conflict) {
        resolvedState = await this.conflictResolver.resolve(
          targetState,
          state,
          options.conflictStrategy
        );
      }

      await this.stateStore.set(targetModule, resolvedState);

      await this.publishStateChangeEvent(targetModule, resolvedState);

      await this.recordSyncHistory({
        syncId,
        sourceModule,
        targetModule,
        conflict,
        resolvedState,
        timestamp: new Date()
      });

      const duration = Date.now() - startTime;

      this.monitoring.recordStateSync({
        syncId,
        sourceModule,
        targetModule,
        duration,
        conflict: !!conflict,
        success: true
      });

      return {
        success: true,
        syncId,
        duration,
        conflict,
        resolvedState
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.monitoring.recordStateSyncError({
        syncId,
        sourceModule,
        targetModule,
        duration,
        error: (error as Error).message
      });

      throw new StateSyncError(
        `状态同步失败: ${(error as Error).message}`,
        { syncId, sourceModule, targetModule }
      );
    }
  }

  async syncAllModules(
    sourceModule: string,
    state: any,
    options: SyncOptions = {}
  ): Promise<SyncResult[]> {
    const targetModules = await this.getDependentModules(sourceModule);

    return await Promise.all(
      targetModules.map(targetModule =>
        this.syncState(sourceModule, targetModule, state, options)
      )
    );
  }

  async scheduleSync(
    sourceModule: string,
    targetModule: string,
    state: any,
    delay: number,
    options: SyncOptions = {}
  ): Promise<string> {
    const syncId = this.generateSyncId();

    this.syncScheduler.scheduleSync(
      syncId,
      async () => {
        await this.syncState(sourceModule, targetModule, state, options);
      },
      delay
    );

    return syncId;
  }

  async getState(module: string): Promise<any> {
    return await this.stateStore.get(module);
  }

  async setState(module: string, state: any): Promise<void> {
    await this.stateStore.set(module, state);
    await this.publishStateChangeEvent(module, state);
  }

  async deleteState(module: string): Promise<void> {
    await this.stateStore.delete(module);
  }

  async getAllStates(): Promise<Map<string, any>> {
    return await this.stateStore.getAll();
  }

  async setDependencies(module: string, dependencies: string[]): Promise<void> {
    await this.stateStore.set(`dependencies_${module}`, dependencies);
  }

  async getDependencies(module: string): Promise<string[]> {
    return await this.stateStore.get(`dependencies_${module}`) || [];
  }

  onStateChange(module: string, handler: (state: any) => void): void {
    this.eventBus.on(`${module}.state.changed`, handler);
  }

  offStateChange(module: string, handler: (state: any) => void): void {
    this.eventBus.off(`${module}.state.changed`, handler);
  }

  getEventBus(): EventEmitter {
    return this.eventBus;
  }

  getMetrics() {
    return this.monitoring.getMetrics();
  }

  async clear(): Promise<void> {
    await this.stateStore.clear();
    this.syncScheduler.cancelAllSyncs();
    this.monitoring.clear();
  }

  private async detectConflict(
    currentState: any,
    newState: any
  ): Promise<Conflict | null> {
    if (!currentState || !newState) {
      return null;
    }

    const currentVersion = currentState.version || 0;
    const newVersion = newState.version || 0;

    if (currentVersion >= newVersion) {
      return {
        type: 'version_conflict',
        currentVersion,
        newVersion,
        currentState,
        newState
      };
    }

    return null;
  }

  private async publishStateChangeEvent(
    module: string,
    state: any
  ): Promise<void> {
    this.eventBus.emit(`${module}.state.changed`, {
      module,
      state,
      timestamp: new Date()
    });
  }

  private async recordSyncHistory(record: SyncHistoryRecord): Promise<void> {
    await this.stateStore.set(`sync_history_${record.syncId}`, record);
  }

  private async getDependentModules(module: string): Promise<string[]> {
    const dependencies = await this.stateStore.get(`dependencies_${module}`);
    return dependencies || [];
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
