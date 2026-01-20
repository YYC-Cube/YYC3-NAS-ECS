/**
 * @file 任务调度器
 * @description 实现智能任务调度系统，支持任务优先级、依赖管理、并发控制等功能
 * @module task-scheduler
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  NotFoundError,
  ConflictError,
  TimeoutError,
  InternalError
} from '../error-handler/ErrorTypes';

export interface Task {
  id: string;
  name: string;
  description?: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execute: () => Promise<any>;
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
}

export interface TaskPlan {
  id: string;
  name: string;
  tasks: Task[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface TaskProgress {
  taskId: string;
  status: Task['status'];
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  estimatedTimeRemaining?: number;
  result?: any;
  error?: Error;
}

export interface SchedulerConfig {
  maxConcurrentTasks?: number;
  enablePrioritization?: boolean;
  enableDependencyResolution?: boolean;
  enableMetrics?: boolean;
  defaultTimeout?: number;
  defaultMaxRetries?: number;
}

export interface SchedulerMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  pendingTasks: number;
  averageExecutionTime: number;
  successRate: number;
}

export class TaskScheduler extends EventEmitter {
  private config: Required<SchedulerConfig>;
  private tasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private taskPlans: Map<string, TaskPlan> = new Map();
  private metrics: SchedulerMetrics;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: SchedulerConfig = {}) {
    super();
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
      enablePrioritization: config.enablePrioritization ?? true,
      enableDependencyResolution: config.enableDependencyResolution ?? true,
      enableMetrics: config.enableMetrics ?? true,
      defaultTimeout: config.defaultTimeout ?? 60000,
      defaultMaxRetries: config.defaultMaxRetries ?? 3,
    };
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): SchedulerMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      runningTasks: 0,
      pendingTasks: 0,
      averageExecutionTime: 0,
      successRate: 0,
    };
  }

  async schedule(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'>): Promise<string> {
    const fullTask: Task = {
      ...task,
      id: this.generateTaskId(),
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      timeout: task.timeout ?? this.config.defaultTimeout,
      maxRetries: task.maxRetries ?? this.config.defaultMaxRetries,
    };

    this.tasks.set(fullTask.id, fullTask);
    this.taskQueue.push(fullTask);

    if (this.config.enablePrioritization) {
      this.sortTaskQueue();
    }

    this.metrics.totalTasks++;
    this.metrics.pendingTasks++;
    this.emit('task_scheduled', fullTask);

    return fullTask.id;
  }

  async schedulePlan(plan: Omit<TaskPlan, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const fullPlan: TaskPlan = {
      ...plan,
      id: this.generatePlanId(),
      status: 'pending',
      createdAt: Date.now(),
    };

    this.taskPlans.set(fullPlan.id, fullPlan);

    for (const task of fullPlan.tasks) {
      task.id = this.generateTaskId();
      task.status = 'pending';
      task.createdAt = Date.now();
      this.tasks.set(task.id, task);
      this.taskQueue.push(task);
      this.metrics.totalTasks++;
      this.metrics.pendingTasks++;
    }

    this.emit('plan_scheduled', fullPlan);

    return fullPlan.id;
  }

  async executeTask(taskId: string): Promise<TaskResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError('task', taskId);
    }

    if (this.config.enableDependencyResolution && task.dependencies) {
      await this.resolveDependencies(task);
    }

    this.runningTasks.set(taskId, task);
    task.status = 'running';
    task.startedAt = Date.now();

    this.metrics.runningTasks++;
    this.metrics.pendingTasks--;
    this.emit('task_started', task);

    try {
      const result = await this.executeWithTimeout(task);
      
      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;

      this.runningTasks.delete(taskId);
      this.metrics.completedTasks++;
      this.metrics.runningTasks--;
      this.updateSuccessRate();
      this.updateAverageExecutionTime(task);

      this.emit('task_completed', task);

      return { success: true, data: result };
    } catch (error) {
      task.status = 'failed';
      task.completedAt = Date.now();
      task.error = error as Error;

      this.runningTasks.delete(taskId);
      this.metrics.failedTasks++;
      this.metrics.runningTasks--;
      this.updateSuccessRate();

      this.emit('task_failed', task);

      return { success: false, error: error as Error };
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError('task', taskId, {
        additionalData: { 
          availableTasks: Array.from(this.tasks.keys()).slice(0, 10)
        }
      });
    }

    if (task.status === 'running') {
      throw new ConflictError(`Cannot cancel running task: ${taskId}`, {
        additionalData: { 
          taskId,
          currentStatus: task.status,
          allowedStatuses: ['pending', 'failed']
        }
      });
    }

    task.status = 'cancelled';
    this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
    this.metrics.pendingTasks--;

    this.emit('task_cancelled', task);
  }

  async cancelPlan(planId: string): Promise<void> {
    const plan = this.taskPlans.get(planId);
    if (!plan) {
      throw new NotFoundError('plan', planId, {
        additionalData: { 
          availablePlans: Array.from(this.taskPlans.keys())
        }
      });
    }

    for (const task of plan.tasks) {
      if (task.status === 'pending') {
        await this.cancelTask(task.id);
      }
    }

    plan.status = 'cancelled';
    this.emit('plan_cancelled', plan);
  }

  getTaskProgress(taskId: string): TaskProgress {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError('task', taskId, {
        additionalData: { 
          availableTasks: Array.from(this.tasks.keys()).slice(0, 10)
        }
      });
    }

    return {
      taskId: task.id,
      status: task.status,
      progress: this.calculateProgress(task),
      currentStep: task.metadata?.currentStep,
      totalSteps: task.metadata?.totalSteps,
      completedSteps: task.metadata?.completedSteps,
      estimatedTimeRemaining: this.estimateTimeRemaining(task),
      result: task.result,
      error: task.error,
    };
  }

  getMetrics(): SchedulerMetrics {
    return { ...this.metrics };
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getPlan(planId: string): TaskPlan | undefined {
    return this.taskPlans.get(planId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getAllPlans(): TaskPlan[] {
    return Array.from(this.taskPlans.values());
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.schedulerInterval = setInterval(() => {
      this.processQueue();
    }, 100);

    this.emit('scheduler_started');
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    this.emit('scheduler_stopped');
  }

  private async processQueue(): Promise<void> {
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    while (this.taskQueue.length > 0 && 
           this.runningTasks.size < this.config.maxConcurrentTasks) {
      const task = this.taskQueue.shift()!;
      this.executeTask(task.id).catch(error => {
        console.error(`Task execution failed: ${task.id}`, error);
      });
    }
  }

  private async resolveDependencies(task: Task): Promise<void> {
    if (!task.dependencies || task.dependencies.length === 0) {
      return;
    }

    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask) {
        throw new NotFoundError('dependency task', depId, {
          additionalData: { taskId: task.id, dependencies: task.dependencies }
        });
      }

      if (depTask.status !== 'completed') {
        await this.executeTask(depId);
      }
    }
  }

  private async executeWithTimeout(task: Task): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new TimeoutError(`Task timeout: ${task.id}`, task.timeout || 30000, {
          additionalData: { taskId: task.id }
        }));
      }, task.timeout);

      task.execute()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          
          if (task.retryCount! < task.maxRetries!) {
            task.retryCount!++;
            this.emit('task_retry', { task, attempt: task.retryCount });
            
            setTimeout(() => {
              this.executeWithTimeout(task).then(resolve).catch(reject);
            }, 1000 * task.retryCount!);
          } else {
            reject(error);
          }
        });
    });
  }

  private sortTaskQueue(): void {
    this.taskQueue.sort((a, b) => b.priority - a.priority);
  }

  private calculateProgress(task: Task): number {
    if (task.status === 'completed') return 100;
    if (task.status === 'pending') return 0;
    if (task.status === 'failed') return 0;

    const { completedSteps = 0, totalSteps = 1 } = task.metadata || {};
    return Math.round((completedSteps / totalSteps) * 100);
  }

  private estimateTimeRemaining(task: Task): number | undefined {
    if (!task.startedAt || task.status !== 'running') {
      return undefined;
    }

    const elapsed = Date.now() - task.startedAt;
    const progress = this.calculateProgress(task);
    
    if (progress === 0) return undefined;
    
    const estimatedTotal = (elapsed / progress) * 100;
    return Math.max(0, estimatedTotal - elapsed);
  }

  private updateSuccessRate(): void {
    const total = this.metrics.completedTasks + this.metrics.failedTasks;
    if (total === 0) {
      this.metrics.successRate = 0;
    } else {
      this.metrics.successRate = this.metrics.completedTasks / total;
    }
  }

  private updateAverageExecutionTime(task: Task): void {
    if (!task.startedAt || !task.completedAt) return;

    const executionTime = task.completedAt - task.startedAt;
    const current = this.metrics.averageExecutionTime;
    const count = this.metrics.completedTasks;
    
    this.metrics.averageExecutionTime = 
      (current * (count - 1) + executionTime) / count;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.stop();
    this.tasks.clear();
    this.taskQueue = [];
    this.runningTasks.clear();
    this.taskPlans.clear();
    this.removeAllListeners();
  }
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: Error;
}

export default TaskScheduler;
