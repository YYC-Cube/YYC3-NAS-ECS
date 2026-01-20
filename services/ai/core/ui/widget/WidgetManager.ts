/**
 * @file Widget管理器
 * @description 管理widget的状态、模块和生命周期
 * @module ui/widget/WidgetManager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import { WidgetState, WidgetTheme } from '../IntelligentAIWidget';

export interface WidgetModule {
  id: string;
  name: string;
  type: 'chat' | 'tools' | 'workflow' | 'insights' | 'custom';
  enabled: boolean;
  visible: boolean;
  config: Record<string, any>;
  instance?: any;
}

export interface WidgetConfig {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  maximized: boolean;
  theme: WidgetTheme;
  visible: boolean;
  zIndex: number;
  activeModule: string;
  modules: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ModuleConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  visible: boolean;
  config: Record<string, any>;
}

export class WidgetManager extends EventEmitter {
  private state: WidgetState;
  private modules: Map<string, WidgetModule>;
  private activeModule: string | null;
  private history: WidgetState[];
  private maxHistorySize: number;
  private currentHistoryIndex: number;
  private autoSave: boolean;
  private autoSaveInterval: number;
  private autoSaveTimer: NodeJS.Timeout | null;

  constructor(initialState: WidgetState) {
    super();

    this.state = initialState;
    this.modules = new Map();
    this.activeModule = initialState.activeModule || null;
    this.history = [JSON.parse(JSON.stringify(initialState))];
    this.maxHistorySize = 50;
    this.currentHistoryIndex = 0;
    this.autoSave = true;
    this.autoSaveInterval = 30000;
    this.autoSaveTimer = null;

    this.initializeModules();
    this.startAutoSave();
  }

  private initializeModules(): void {
    const defaultModules: ModuleConfig[] = [
      {
        id: 'chat',
        name: 'Chat Interface',
        type: 'chat',
        enabled: true,
        visible: true,
        config: {},
      },
      {
        id: 'tools',
        name: 'Toolbox Panel',
        type: 'tools',
        enabled: true,
        visible: false,
        config: {},
      },
      {
        id: 'workflow',
        name: 'Workflow Designer',
        type: 'workflow',
        enabled: true,
        visible: false,
        config: {},
      },
      {
        id: 'insights',
        name: 'Insights Dashboard',
        type: 'insights',
        enabled: true,
        visible: false,
        config: {},
      },
    ];

    defaultModules.forEach((moduleConfig) => {
      const module: WidgetModule = {
        id: moduleConfig.id,
        name: moduleConfig.name,
        type: moduleConfig.type as any,
        enabled: moduleConfig.enabled,
        visible: moduleConfig.visible,
        config: moduleConfig.config,
      };
      this.modules.set(moduleConfig.id, module);
    });

    this.state.modules = Object.fromEntries(
      Array.from(this.modules.entries()).map(([id, module]) => [id, module.config])
    );
  }

  private startAutoSave(): void {
    if (!this.autoSave) return;

    this.autoSaveTimer = setInterval(() => {
      this.saveState();
    }, this.autoSaveInterval);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  getState(): WidgetState {
    return { ...this.state };
  }

  setState(newState: Partial<WidgetState>): void {
    const previousState = { ...this.state };

    this.state = {
      ...this.state,
      ...newState,
    };

    this.addToHistory();
    this.emit('state:changed', this.state, previousState);
  }

  private addToHistory(): void {
    const stateSnapshot = JSON.parse(JSON.stringify(this.state));

    if (this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }

    this.history.push(stateSnapshot);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentHistoryIndex++;
    }
  }

  undo(): WidgetState | null {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      const previousState = { ...this.state };
      this.state = JSON.parse(JSON.stringify(this.history[this.currentHistoryIndex]));
      this.emit('state:changed', this.state, previousState);
      this.emit('undo', this.state);
      return this.state;
    }
    return null;
  }

  redo(): WidgetState | null {
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.currentHistoryIndex++;
      const previousState = { ...this.state };
      this.state = JSON.parse(JSON.stringify(this.history[this.currentHistoryIndex]));
      this.emit('state:changed', this.state, previousState);
      this.emit('redo', this.state);
      return this.state;
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentHistoryIndex > 0;
  }

  canRedo(): boolean {
    return this.currentHistoryIndex < this.history.length - 1;
  }

  clearHistory(): void {
    this.history = [JSON.parse(JSON.stringify(this.state))];
    this.currentHistoryIndex = 0;
    this.emit('history:cleared');
  }

  getHistory(): WidgetState[] {
    return JSON.parse(JSON.stringify(this.history));
  }

  registerModule(module: WidgetModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with id ${module.id} already exists`);
    }

    this.modules.set(module.id, module);
    this.state.modules[module.id] = module.config;
    this.emit('module:registered', module);
  }

  unregisterModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    this.modules.delete(moduleId);
    delete this.state.modules[moduleId];
    this.emit('module:unregistered', module);
  }

  getModule(moduleId: string): WidgetModule | undefined {
    return this.modules.get(moduleId);
  }

  getModules(): WidgetModule[] {
    return Array.from(this.modules.values());
  }

  getActiveModule(): WidgetModule | null {
    if (!this.activeModule) {
      return null;
    }
    return this.modules.get(this.activeModule) || null;
  }

  activateModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    if (!module.enabled) {
      throw new Error(`Module ${moduleId} is not enabled`);
    }

    this.activeModule = moduleId;
    this.state.activeModule = moduleId;
    this.emit('module:activated', moduleId);
  }

  deactivateModule(moduleId: string): void {
    if (this.activeModule === moduleId) {
      this.activeModule = null;
      this.state.activeModule = '';
      this.emit('module:deactivated', moduleId);
    }
  }

  enableModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    module.enabled = true;
    this.emit('module:enabled', moduleId);
  }

  disableModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    module.enabled = false;
    module.visible = false;

    if (this.activeModule === moduleId) {
      this.activeModule = null;
      this.state.activeModule = '';
    }

    this.emit('module:disabled', moduleId);
  }

  showModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    if (!module.enabled) {
      throw new Error(`Module ${moduleId} is not enabled`);
    }

    module.visible = true;
    this.emit('module:shown', moduleId);
  }

  hideModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    module.visible = false;
    this.emit('module:hidden', moduleId);
  }

  toggleModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    module.visible = !module.visible;
    this.emit(module.visible ? 'module:shown' : 'module:hidden', moduleId);
  }

  updateModuleConfig(moduleId: string, config: Record<string, any>): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    module.config = { ...module.config, ...config };
    this.state.modules[moduleId] = module.config;
    this.emit('module:config:updated', { moduleId, config });
  }

  getModuleConfig(moduleId: string): Record<string, any> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module with id ${moduleId} not found`);
    }

    return { ...module.config };
  }

  setPosition(x: number, y: number): void {
    this.state.position = { x, y };
    this.emit('position:changed', { x, y });
  }

  getPosition(): { x: number; y: number } {
    return { ...this.state.position };
  }

  setSize(width: number, height: number): void {
    this.state.size = { width, height };
    this.emit('size:changed', { width, height });
  }

  getSize(): { width: number; height: number } {
    return { ...this.state.size };
  }

  setTitle(title: string): void {
    this.state.title = title;
    this.emit('title:changed', title);
  }

  getTitle(): string {
    return this.state.title;
  }

  setMinimized(minimized: boolean): void {
    this.state.minimized = minimized;
    this.emit(minimized ? 'minimized' : 'restored');
  }

  isMinimized(): boolean {
    return this.state.minimized;
  }

  setMaximized(maximized: boolean): void {
    this.state.maximized = maximized;
    this.emit(maximized ? 'maximized' : 'restored');
  }

  isMaximized(): boolean {
    return this.state.maximized;
  }

  setVisible(visible: boolean): void {
    this.state.visible = visible;
    this.emit('visibility:changed', { visible });
  }

  isVisible(): boolean {
    return this.state.visible;
  }

  setZIndex(zIndex: number): void {
    this.state.zIndex = zIndex;
    this.emit('zIndex:changed', zIndex);
  }

  getZIndex(): number {
    return this.state.zIndex;
  }

  setTheme(theme: WidgetTheme): void {
    this.state.theme = theme;
    this.emit('theme:changed', theme);
  }

  getTheme(): WidgetTheme {
    return this.state.theme;
  }

  setMetadata(key: string, value: any): void {
    this.state.metadata[key] = value;
    this.emit('metadata:changed', { key, value });
  }

  getMetadata(key?: string): any {
    if (key) {
      return this.state.metadata[key];
    }
    return { ...this.state.metadata };
  }

  saveState(): void {
    this.emit('state:saved', this.state);
  }

  loadState(state: WidgetState): void {
    this.state = { ...state };
    this.activeModule = state.activeModule || null;
    this.modules.clear();

    Object.entries(state.modules).forEach(([id, config]) => {
      const module: WidgetModule = {
        id,
        name: id,
        type: 'custom',
        enabled: true,
        visible: true,
        config: config as Record<string, any>,
      };
      this.modules.set(id, module);
    });

    this.addToHistory();
    this.emit('state:loaded', state);
  }

  reset(): void {
    const initialState = this.history[0];
    this.loadState(initialState);
    this.emit('reset');
  }

  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importState(stateJson: string): void {
    try {
      const state = JSON.parse(stateJson) as WidgetState;
      this.loadState(state);
      this.emit('state:imported', state);
    } catch (error) {
      throw new Error('Failed to import state: Invalid JSON format');
    }
  }

  setAutoSave(enabled: boolean): void {
    this.autoSave = enabled;

    if (enabled) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }

    this.emit('autosave:changed', enabled);
  }

  isAutoSaveEnabled(): boolean {
    return this.autoSave;
  }

  setAutoSaveInterval(interval: number): void {
    this.autoSaveInterval = interval;

    if (this.autoSave) {
      this.stopAutoSave();
      this.startAutoSave();
    }

    this.emit('autosave:interval:changed', interval);
  }

  getAutoSaveInterval(): number {
    return this.autoSaveInterval;
  }

  destroy(): void {
    this.stopAutoSave();
    this.modules.clear();
    this.history = [];
    this.removeAllListeners();
    this.emit('destroyed');
  }
}
