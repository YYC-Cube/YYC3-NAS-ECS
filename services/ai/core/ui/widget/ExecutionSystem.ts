/**
 * @file ExecutionSystem 执行系统
 * @description 五维闭环系统中的执行维度，负责任务调度、命令执行、工作流管理和资源协调
 * @module core/ui/widget/execution
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 * @updated 2026-01-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';

export interface ExecutionConfig {
  enabled?: boolean;
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enablePriorityQueue?: boolean;
  enableTaskDependencies?: boolean;
  enableWorkflow?: boolean;
  enableResourceManagement?: boolean;
  onTaskComplete?: (task: Task) => void;
  onTaskFailed?: (task: Task, error: Error) => void;
  onWorkflowComplete?: (workflow: Workflow) => void;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  handler: TaskHandler;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  dependencies?: string[];
  timeout?: number;
  retryCount?: number;
  maxRetries?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: any;
  error?: Error;
  metadata?: Record<string, any>;
  progress?: number;
}

export type TaskHandler = (context: TaskContext) => Promise<any>;

export interface TaskContext {
  task: Task;
  signal: AbortSignal;
  updateProgress: (progress: number) => void;
  emitEvent: (event: string, data?: any) => void;
  getDependencyResult: (taskId: string) => any;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  dependencies?: Record<string, string[]>;
  onTaskComplete?: (task: Task) => void;
  onTaskFailed?: (task: Task, error: Error) => void;
}

export interface ExecutionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageExecutionTime: number;
  successRate: number;
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  currentQueueSize: number;
  currentRunningTasks: number;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  used: number;
  available: number;
  metadata?: Record<string, any>;
}

export interface ResourceAllocation {
  taskId: string;
  resourceId: string;
  amount: number;
  allocatedAt: number;
  releasedAt?: number;
}

export class ExecutionSystem extends EventEmitter {
  private config: Required<ExecutionConfig>;
  private taskQueue: Task[];
  private runningTasks: Map<string, Task>;
  private completedTasks: Map<string, Task>;
  private workflows: Map<string, Workflow>;
  private resources: Map<string, Resource>;
  private resourceAllocations: Map<string, ResourceAllocation[]>;
  private metrics: ExecutionMetrics;
  private enabled: boolean;
  private maxConcurrentTasks: number;
  private taskTimeout: number;
  private enableRetry: boolean;
  private maxRetries: number;
  private retryDelay: number;
  private enablePriorityQueue: boolean;
  private enableTaskDependencies: boolean;
  private enableWorkflow: boolean;
  private enableResourceManagement: boolean;
  private abortControllers: Map<string, AbortController>;
  private executionHistory: Map<string, number[]>;

  constructor(config: ExecutionConfig = {}) {
    super();

    this.config = {
      enabled: true,
      maxConcurrentTasks: 5,
      taskTimeout: 30000,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enablePriorityQueue: true,
      enableTaskDependencies: true,
      enableWorkflow: true,
      enableResourceManagement: true,
      onTaskComplete: undefined,
      onTaskFailed: undefined,
      onWorkflowComplete: undefined,
      ...config,
    };

    this.taskQueue = [];
    this.runningTasks = new Map();
    this.completedTasks = new Map();
    this.workflows = new Map();
    this.resources = new Map();
    this.resourceAllocations = new Map();
    this.abortControllers = new Map();
    this.executionHistory = new Map();

    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      averageExecutionTime: 0,
      successRate: 1.0,
      totalWorkflows: 0,
      completedWorkflows: 0,
      failedWorkflows: 0,
      currentQueueSize: 0,
      currentRunningTasks: 0,
    };

    this.enabled = this.config.enabled;
    this.maxConcurrentTasks = this.config.maxConcurrentTasks;
    this.taskTimeout = this.config.taskTimeout;
    this.enableRetry = this.config.enableRetry;
    this.maxRetries = this.config.maxRetries;
    this.retryDelay = this.config.retryDelay;
    this.enablePriorityQueue = this.config.enablePriorityQueue;
    this.enableTaskDependencies = this.config.enableTaskDependencies;
    this.enableWorkflow = this.config.enableWorkflow;
    this.enableResourceManagement = this.config.enableResourceManagement;

    if (this.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.emit('initialized');
  }

  public addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'>): string {
    if (!this.enabled) {
      throw new Error('ExecutionSystem is disabled');
    }

    const taskId = this.generateTaskId(task.name);
    const newTask: Task = {
      id: taskId,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: task.maxRetries ?? this.config.maxRetries,
      ...task,
    };

    this.taskQueue.push(newTask);
    this.metrics.totalTasks++;
    this.metrics.currentQueueSize = this.taskQueue.length;

    if (this.enablePriorityQueue) {
      this.sortTaskQueue();
    }

    this.emit('task:added', newTask);
    this.processQueue();

    return taskId;
  }

  public addWorkflow(workflow: Omit<Workflow, 'id' | 'status' | 'createdAt'>): string {
    if (!this.enabled || !this.enableWorkflow) {
      throw new Error('Workflow is disabled or ExecutionSystem is disabled');
    }

    const workflowId = this.generateWorkflowId(workflow.name);
    const newWorkflow: Workflow = {
      id: workflowId,
      status: 'pending',
      createdAt: Date.now(),
      ...workflow,
    };

    this.workflows.set(workflowId, newWorkflow);
    this.metrics.totalWorkflows++;

    newWorkflow.tasks.forEach(task => {
      this.addTask(task);
    });

    this.emit('workflow:added', newWorkflow);

    return workflowId;
  }

  private processQueue(): void {
    if (this.runningTasks.size >= this.maxConcurrentTasks) {
      return;
    }

    while (this.runningTasks.size < this.maxConcurrentTasks && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      this.executeTask(task);
    }

    this.metrics.currentQueueSize = this.taskQueue.length;
    this.metrics.currentRunningTasks = this.runningTasks.size;
  }

  private async executeTask(task: Task): Promise<void> {
    if (this.enableTaskDependencies && task.dependencies && task.dependencies.length > 0) {
      const dependenciesMet = task.dependencies.every(depId => {
        const depTask = this.completedTasks.get(depId);
        return depTask && depTask.status === 'completed';
      });

      if (!dependenciesMet) {
        this.taskQueue.push(task);
        return;
      }
    }

    task.status = 'running';
    task.startedAt = Date.now();
    this.runningTasks.set(task.id, task);

    const abortController = new AbortController();
    this.abortControllers.set(task.id, abortController);

    this.emit('task:started', task);

    try {
      const context: TaskContext = {
        task,
        signal: abortController.signal,
        updateProgress: (progress: number) => {
          task.progress = progress;
          this.emit('task:progress', task);
        },
        emitEvent: (event: string, data?: any) => {
          this.emit(`task:${task.id}:${event}`, data);
        },
        getDependencyResult: (taskId: string) => {
          const depTask = this.completedTasks.get(taskId);
          return depTask?.result;
        },
      };

      const timeout = task.timeout ?? this.taskTimeout;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), timeout);
      });

      const result = await Promise.race([
        task.handler(context),
        timeoutPromise,
      ]);

      task.result = result;
      task.status = 'completed';
      task.completedAt = Date.now();

      this.runningTasks.delete(task.id);
      this.completedTasks.set(task.id, task);
      this.abortControllers.delete(task.id);

      this.metrics.completedTasks++;
      this.updateExecutionMetrics(task);

      this.emit('task:completed', task);

      if (this.config.onTaskComplete) {
        this.config.onTaskComplete(task);
      }

      this.releaseTaskResources(task.id);
      this.checkWorkflowCompletion(task);

    } catch (error) {
      const err = error as Error;
      task.error = err;

      if (this.enableRetry && task.retryCount! < task.maxRetries!) {
        task.retryCount!++;
        task.status = 'pending';

        setTimeout(() => {
          this.taskQueue.push(task);
          this.processQueue();
        }, this.retryDelay);

        this.emit('task:retry', task);
      } else {
        task.status = 'failed';
        task.completedAt = Date.now();

        this.runningTasks.delete(task.id);
        this.completedTasks.set(task.id, task);
        this.abortControllers.delete(task.id);

        this.metrics.failedTasks++;
        this.updateExecutionMetrics(task);

        this.emit('task:failed', task);

        if (this.config.onTaskFailed) {
          this.config.onTaskFailed(task, err);
        }

        this.releaseTaskResources(task.id);
        this.checkWorkflowFailure(task);
      }
    }

    this.processQueue();
  }

  private checkWorkflowCompletion(task: Task): void {
    for (const [workflowId, workflow] of this.workflows) {
      if (workflow.status === 'running' || workflow.status === 'pending') {
        const allTasksCompleted = workflow.tasks.every(t => t.status === 'completed');
        const anyTaskFailed = workflow.tasks.some(t => t.status === 'failed');

        if (allTasksCompleted && !anyTaskFailed) {
          workflow.status = 'completed';
          workflow.completedAt = Date.now();

          this.metrics.completedWorkflows++;
          this.emit('workflow:completed', workflow);

          if (this.config.onWorkflowComplete) {
            this.config.onWorkflowComplete(workflow);
          }
        }
      }
    }
  }

  private checkWorkflowFailure(task: Task): void {
    for (const [workflowId, workflow] of this.workflows) {
      if (workflow.status === 'running' || workflow.status === 'pending') {
        const anyTaskFailed = workflow.tasks.some(t => t.status === 'failed');

        if (anyTaskFailed) {
          workflow.status = 'failed';
          workflow.completedAt = Date.now();

          this.metrics.failedWorkflows++;
          this.emit('workflow:failed', workflow);
        }
      }
    }
  }

  public cancelTask(taskId: string): boolean {
    const task = this.runningTasks.get(taskId) || this.taskQueue.find(t => t.id === taskId);

    if (!task) {
      return false;
    }

    if (task.status === 'running') {
      const abortController = this.abortControllers.get(taskId);
      if (abortController) {
        abortController.abort();
      }
    }

    task.status = 'cancelled';
    task.completedAt = Date.now();

    if (this.runningTasks.has(taskId)) {
      this.runningTasks.delete(taskId);
      this.metrics.cancelledTasks++;
    } else {
      const index = this.taskQueue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.taskQueue.splice(index, 1);
      }
    }

    this.completedTasks.set(taskId, task);
    this.abortControllers.delete(taskId);

    this.emit('task:cancelled', task);
    this.releaseTaskResources(taskId);

    this.processQueue();

    return true;
  }

  public cancelWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      return false;
    }

    workflow.tasks.forEach(task => {
      this.cancelTask(task.id);
    });

    workflow.status = 'cancelled';
    workflow.completedAt = Date.now();

    this.emit('workflow:cancelled', workflow);

    return true;
  }

  public getTask(taskId: string): Task | undefined {
    return this.runningTasks.get(taskId) ||
           this.completedTasks.get(taskId) ||
           this.taskQueue.find(t => t.id === taskId);
  }

  public getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  public addResource(resource: Omit<Resource, 'id' | 'used' | 'available'>): string {
    const resourceId = this.generateResourceId(resource.name);
    const newResource: Resource = {
      id: resourceId,
      used: 0,
      available: resource.capacity,
      ...resource,
    };

    this.resources.set(resourceId, newResource);

    this.emit('resource:added', newResource);

    return resourceId;
  }

  public allocateResource(taskId: string, resourceId: string, amount: number): boolean {
    const resource = this.resources.get(resourceId);

    if (!resource || resource.available < amount) {
      return false;
    }

    resource.used += amount;
    resource.available -= amount;

    const allocation: ResourceAllocation = {
      taskId,
      resourceId,
      amount,
      allocatedAt: Date.now(),
    };

    if (!this.resourceAllocations.has(taskId)) {
      this.resourceAllocations.set(taskId, []);
    }

    this.resourceAllocations.get(taskId)!.push(allocation);

    this.emit('resource:allocated', { taskId, resourceId, amount });

    return true;
  }

  private releaseTaskResources(taskId: string): void {
    const allocations = this.resourceAllocations.get(taskId);

    if (!allocations) {
      return;
    }

    allocations.forEach(allocation => {
      const resource = this.resources.get(allocation.resourceId);
      if (resource) {
        resource.used -= allocation.amount;
        resource.available += allocation.amount;
        allocation.releasedAt = Date.now();

        this.emit('resource:released', allocation);
      }
    });

    this.resourceAllocations.delete(taskId);
  }

  public getResource(resourceId: string): Resource | undefined {
    return this.resources.get(resourceId);
  }

  public getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  private sortTaskQueue(): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    this.taskQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return a.createdAt - b.createdAt;
    });
  }

  private updateExecutionMetrics(task: Task): void {
    if (task.startedAt && task.completedAt) {
      const executionTime = task.completedAt - task.startedAt;

      const history = this.executionHistory.get('execution_time') || [];
      history.push(executionTime);
      if (history.length > 100) {
        history.shift();
      }
      this.executionHistory.set('execution_time', history);

      this.metrics.averageExecutionTime = history.reduce((a, b) => a + b, 0) / history.length;
    }

    const totalCompleted = this.metrics.completedTasks + this.metrics.failedTasks;
    this.metrics.successRate = totalCompleted > 0 ? this.metrics.completedTasks / totalCompleted : 1.0;
  }

  private generateTaskId(name: string): string {
    return `task-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowId(name: string): string {
    return `workflow-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResourceId(name: string): string {
    return `resource-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getMetrics(): ExecutionMetrics {
    return { ...this.metrics };
  }

  public getTaskQueue(): Task[] {
    return [...this.taskQueue];
  }

  public getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values());
  }

  public getCompletedTasks(limit?: number): Task[] {
    const tasks = Array.from(this.completedTasks.values());
    if (limit) {
      return tasks.slice(-limit);
    }
    return tasks;
  }

  public getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  public pause(): void {
    this.enabled = false;
    this.emit('paused');
  }

  public resume(): void {
    this.enabled = true;
    this.processQueue();
    this.emit('resumed');
  }

  public clearQueue(): void {
    this.taskQueue.forEach(task => {
      task.status = 'cancelled';
      this.completedTasks.set(task.id, task);
    });

    const clearedCount = this.taskQueue.length;
    this.taskQueue = [];
    this.metrics.cancelledTasks += clearedCount;
    this.metrics.currentQueueSize = 0;

    this.emit('queue:cleared', clearedCount);
  }

  public clearCompletedTasks(olderThan?: number): void {
    const cutoffTime = olderThan || Date.now() - 24 * 60 * 60 * 1000;

    let clearedCount = 0;
    for (const [taskId, task] of this.completedTasks) {
      if (task.completedAt && task.completedAt < cutoffTime) {
        this.completedTasks.delete(taskId);
        clearedCount++;
      }
    }

    this.emit('tasks:cleared', clearedCount);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled) {
      this.processQueue();
    }

    this.emit('enabled:changed', enabled);
  }

  public updateConfig(config: Partial<ExecutionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.maxConcurrentTasks !== undefined) {
      this.maxConcurrentTasks = config.maxConcurrentTasks;
      this.processQueue();
    }

    if (config.taskTimeout !== undefined) {
      this.taskTimeout = config.taskTimeout;
    }

    if (config.enableRetry !== undefined) {
      this.enableRetry = config.enableRetry;
    }

    if (config.maxRetries !== undefined) {
      this.maxRetries = config.maxRetries;
    }

    if (config.retryDelay !== undefined) {
      this.retryDelay = config.retryDelay;
    }

    if (config.enablePriorityQueue !== undefined) {
      this.enablePriorityQueue = config.enablePriorityQueue;
      if (this.enablePriorityQueue) {
        this.sortTaskQueue();
      }
    }

    if (config.enableTaskDependencies !== undefined) {
      this.enableTaskDependencies = config.enableTaskDependencies;
    }

    if (config.enableWorkflow !== undefined) {
      this.enableWorkflow = config.enableWorkflow;
    }

    if (config.enableResourceManagement !== undefined) {
      this.enableResourceManagement = config.enableResourceManagement;
    }

    this.emit('config:updated', this.config);
  }

  public destroy(): void {
    this.pause();

    this.runningTasks.forEach(task => {
      this.cancelTask(task.id);
    });

    this.clearQueue();
    this.clearCompletedTasks();

    this.workflows.clear();
    this.resources.clear();
    this.resourceAllocations.clear();
    this.abortControllers.clear();
    this.executionHistory.clear();

    this.removeAllListeners();
    this.emit('destroyed');
  }
}
