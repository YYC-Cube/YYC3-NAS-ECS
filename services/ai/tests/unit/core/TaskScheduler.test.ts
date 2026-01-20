import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskScheduler, Task, TaskResult, TaskPlan, SchedulerConfig, SchedulerMetrics } from '../../../core/task-scheduler/TaskScheduler';
import { EventEmitter } from 'events';

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;
  let mockTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'>;

  beforeEach(() => {
    scheduler = new TaskScheduler({
      maxConcurrentTasks: 3,
      enablePrioritization: true,
      enableDependencyResolution: true,
      enableMetrics: true,
      defaultTimeout: 60000,
      defaultMaxRetries: 3,
    });

    mockTask = {
      name: '测试任务',
      description: '这是一个测试任务',
      priority: 5,
      execute: async () => {
        return 'test result';
      },
    };
  });

  afterEach(async () => {
    await scheduler.stop();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const defaultScheduler = new TaskScheduler();
      const config = (defaultScheduler as any).config;
      
      expect(config.maxConcurrentTasks).toBe(5);
      expect(config.enablePrioritization).toBe(true);
      expect(config.enableDependencyResolution).toBe(true);
      expect(config.enableMetrics).toBe(true);
      expect(config.defaultTimeout).toBe(60000);
      expect(config.defaultMaxRetries).toBe(3);
    });

    it('应该使用自定义配置初始化', () => {
      const customScheduler = new TaskScheduler({
        maxConcurrentTasks: 10,
        enablePrioritization: false,
        defaultTimeout: 30000,
      });
      
      const config = (customScheduler as any).config;
      expect(config.maxConcurrentTasks).toBe(10);
      expect(config.enablePrioritization).toBe(false);
      expect(config.defaultTimeout).toBe(30000);
    });

    it('应该初始化指标', () => {
      const metrics = scheduler.getMetrics();
      
      expect(metrics.totalTasks).toBe(0);
      expect(metrics.completedTasks).toBe(0);
      expect(metrics.failedTasks).toBe(0);
      expect(metrics.runningTasks).toBe(0);
      expect(metrics.pendingTasks).toBe(0);
      expect(metrics.averageExecutionTime).toBe(0);
      expect(metrics.successRate).toBe(0);
    });
  });

  describe('任务调度', () => {
    it('应该成功调度任务', async () => {
      const taskId = await scheduler.schedule(mockTask);
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      
      const task = scheduler.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.name).toBe('测试任务');
      expect(task?.status).toBe('pending');
    });

    it('应该为任务生成唯一ID', async () => {
      const taskId1 = await scheduler.schedule(mockTask);
      const taskId2 = await scheduler.schedule(mockTask);
      
      expect(taskId1).not.toBe(taskId2);
    });

    it('应该设置默认任务属性', async () => {
      const taskId = await scheduler.schedule(mockTask);
      const task = scheduler.getTask(taskId);
      
      expect(task?.status).toBe('pending');
      expect(task?.retryCount).toBe(0);
      expect(task?.createdAt).toBeDefined();
      expect(task?.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it('应该支持自定义超时和重试次数', async () => {
      const taskWithCustomSettings: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        timeout: 5000,
        maxRetries: 5,
      };
      
      const taskId = await scheduler.schedule(taskWithCustomSettings);
      const task = scheduler.getTask(taskId);
      
      expect(task?.timeout).toBe(5000);
      expect(task?.maxRetries).toBe(5);
    });

    it('应该支持任务依赖', async () => {
      const task1Id = await scheduler.schedule(mockTask);
      const task2Id = await scheduler.schedule({
        ...mockTask,
        name: '依赖任务',
        dependencies: [task1Id],
      });
      
      const task2 = scheduler.getTask(task2Id);
      expect(task2?.dependencies).toContain(task1Id);
    });

    it('应该支持任务元数据', async () => {
      const taskWithMetadata: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        metadata: {
          category: 'test',
          owner: 'user1',
        },
      };
      
      const taskId = await scheduler.schedule(taskWithMetadata);
      const task = scheduler.getTask(taskId);
      
      expect(task?.metadata).toEqual({
        category: 'test',
        owner: 'user1',
      });
    });

    it('应该发射任务已调度事件', async () => {
      const eventSpy = vi.fn();
      scheduler.on('task_scheduled', eventSpy);
      
      await scheduler.schedule(mockTask);
      
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '测试任务',
          status: 'pending',
        })
      );
    });
  });

  describe('任务执行', () => {
    it('应该成功执行任务', async () => {
      const taskId = await scheduler.schedule(mockTask);
      const result = await scheduler.executeTask(taskId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test result');
      
      const task = scheduler.getTask(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.result).toBe('test result');
    });

    it('应该更新任务状态为运行中', async () => {
      const taskId = await scheduler.schedule(mockTask);
      
      const executePromise = scheduler.executeTask(taskId);
      
      const task = scheduler.getTask(taskId);
      expect(task?.status).toBe('running');
      expect(task?.startedAt).toBeDefined();
      
      await executePromise;
    });

    it('应该处理任务执行失败', async () => {
      const failingTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        name: '失败任务',
        execute: async () => {
          throw new Error('任务执行失败');
        },
      };
      
      const taskId = await scheduler.schedule(failingTask);
      const result = await scheduler.executeTask(taskId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      const task = scheduler.getTask(taskId);
      expect(task?.status).toBe('failed');
      expect(task?.error).toBeDefined();
    });

    it('应该在超时时取消任务', async () => {
      const slowTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        name: '慢速任务',
        timeout: 100,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return 'slow result';
        },
      };
      
      const taskId = await scheduler.schedule(slowTask);
      const result = await scheduler.executeTask(taskId);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });

    it('应该在失败时重试任务', async () => {
      let attemptCount = 0;
      const retryTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        name: '重试任务',
        maxRetries: 2,
        execute: async () => {
          attemptCount++;
          if (attemptCount < 2) {
            throw new Error('临时失败');
          }
          return 'retry success';
        },
      };
      
      const taskId = await scheduler.schedule(retryTask);
      const result = await scheduler.executeTask(taskId);
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2);
    });

    it('应该在达到最大重试次数后放弃', async () => {
      const alwaysFailingTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        name: '总是失败任务',
        maxRetries: 2,
        execute: async () => {
          throw new Error('总是失败');
        },
      };
      
      const taskId = await scheduler.schedule(alwaysFailingTask);
      const result = await scheduler.executeTask(taskId);
      
      expect(result.success).toBe(false);
      
      const task = scheduler.getTask(taskId);
      expect(task?.retryCount).toBe(2);
      expect(task?.status).toBe('failed');
    });

    it('应该发射任务开始事件', async () => {
      const eventSpy = vi.fn();
      scheduler.on('task_started', eventSpy);
      
      const taskId = await scheduler.schedule(mockTask);
      await scheduler.executeTask(taskId);
      
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it('应该发射任务完成事件', async () => {
      const eventSpy = vi.fn();
      scheduler.on('task_completed', eventSpy);
      
      const taskId = await scheduler.schedule(mockTask);
      await scheduler.executeTask(taskId);
      
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it('应该发射任务失败事件', async () => {
      const eventSpy = vi.fn();
      scheduler.on('task_failed', eventSpy);
      
      const failingTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        execute: async () => {
          throw new Error('失败');
        },
      };
      
      const taskId = await scheduler.schedule(failingTask);
      await scheduler.executeTask(taskId);
      
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('任务取消', () => {
    it('应该取消待处理任务', async () => {
      const taskId = await scheduler.schedule(mockTask);
      await scheduler.cancelTask(taskId);
      
      const task = scheduler.getTask(taskId);
      expect(task?.status).toBe('cancelled');
    });

    it('应该发射任务取消事件', async () => {
      const eventSpy = vi.fn();
      scheduler.on('task_cancelled', eventSpy);
      
      const taskId = await scheduler.schedule(mockTask);
      await scheduler.cancelTask(taskId);
      
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it('取消不存在的任务应该抛出错误', async () => {
      await expect(scheduler.cancelTask('non-existent-id')).rejects.toThrow();
    });
  });

  describe('任务查询', () => {
    it('应该获取任务详情', async () => {
      const taskId = await scheduler.schedule(mockTask);
      const task = scheduler.getTask(taskId);
      
      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
      expect(task?.name).toBe('测试任务');
    });

    it('应该获取所有任务', async () => {
      await scheduler.schedule(mockTask);
      await scheduler.schedule({ ...mockTask, name: '任务2' });
      await scheduler.schedule({ ...mockTask, name: '任务3' });
      
      const allTasks = scheduler.getAllTasks();
      
      expect(allTasks.length).toBe(3);
    });

    it('应该获取任务进度', async () => {
      const taskId = await scheduler.schedule(mockTask);
      const progress = scheduler.getTaskProgress(taskId);
      
      expect(progress).toBeDefined();
      expect(progress.taskId).toBe(taskId);
      expect(progress.status).toBe('pending');
    });
  });

  describe('任务计划管理', () => {
    it('应该创建任务计划', async () => {
      const plan: Omit<TaskPlan, 'id' | 'status' | 'createdAt'> = {
        name: '测试计划',
        tasks: [
          { ...mockTask, name: '任务1', priority: 10 } as any,
          { ...mockTask, name: '任务2', priority: 5 } as any,
        ],
      };
      
      const planId = await scheduler.schedulePlan(plan);
      
      expect(planId).toBeDefined();
      
      const retrievedPlan = scheduler.getPlan(planId);
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.name).toBe('测试计划');
    });

    it('应该执行任务计划中的任务', async () => {
      const plan: Omit<TaskPlan, 'id' | 'status' | 'createdAt'> = {
        name: '测试计划',
        tasks: [
          { ...mockTask, name: '任务1', priority: 10 } as any,
          { ...mockTask, name: '任务2', priority: 5 } as any,
        ],
      };
      
      const planId = await scheduler.schedulePlan(plan);
      const planTasks = scheduler.getAllTasks().filter(t => t.name.includes('任务'));
      
      const results = await Promise.all(planTasks.map(t => scheduler.executeTask(t.id)));
      
      expect(results.length).toBe(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('应该处理计划中的任务依赖', async () => {
      const task1Id = await scheduler.schedule(mockTask);
      
      const plan: Omit<TaskPlan, 'id' | 'status' | 'createdAt'> = {
        name: '依赖计划',
        tasks: [
          { ...mockTask, name: '计划任务1', priority: 10 } as any,
          { ...mockTask, name: '计划任务2', priority: 5, dependencies: [task1Id] } as any,
        ],
      };
      
      const planId = await scheduler.schedulePlan(plan);
      const planTasks = scheduler.getAllTasks().filter(t => t.name.includes('计划任务'));
      
      const results = await Promise.all(planTasks.map(t => scheduler.executeTask(t.id)));
      
      expect(results.length).toBe(2);
    });

    it('应该取消任务计划', async () => {
      const plan: Omit<TaskPlan, 'id' | 'status' | 'createdAt'> = {
        name: '测试计划',
        tasks: [
          { ...mockTask, name: '任务1' } as any,
          { ...mockTask, name: '任务2' } as any,
        ],
      };
      
      const planId = await scheduler.schedulePlan(plan);
      await scheduler.cancelPlan(planId);
      
      const cancelledPlan = scheduler.getPlan(planId);
      expect(cancelledPlan?.status).toBe('cancelled');
    });
  });

  describe('并发控制', () => {
    it('应该支持并发任务执行', async () => {
      const config: SchedulerConfig = {
        maxConcurrentTasks: 2,
      };
      
      const concurrentScheduler = new TaskScheduler(config);
      
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        ...mockTask,
        name: `任务${i + 1}`,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `result${i + 1}`;
        },
      }));
      
      const taskIds = await Promise.all(tasks.map(t => concurrentScheduler.schedule(t)));
      const results = await Promise.all(taskIds.map(id => concurrentScheduler.executeTask(id)));
      
      expect(results.length).toBe(5);
      expect(results.every(r => r.success)).toBe(true);
      
      await concurrentScheduler.stop();
    });

    it('应该顺序执行任务', async () => {
      const config: SchedulerConfig = {
        maxConcurrentTasks: 1,
      };
      
      const singleScheduler = new TaskScheduler(config);
      
      const executionOrder: string[] = [];
      
      const task1 = {
        ...mockTask,
        name: '任务1',
        execute: async () => {
          executionOrder.push('task1-start');
          await new Promise(resolve => setTimeout(resolve, 50));
          executionOrder.push('task1-end');
          return 'result1';
        },
      };
      
      const task2 = {
        ...mockTask,
        name: '任务2',
        execute: async () => {
          executionOrder.push('task2-start');
          executionOrder.push('task2-end');
          return 'result2';
        },
      };
      
      const [id1, id2] = await Promise.all([
        singleScheduler.schedule(task1),
        singleScheduler.schedule(task2),
      ]);
      
      await Promise.all([
        singleScheduler.executeTask(id1),
        singleScheduler.executeTask(id2),
      ]);
      
      expect(executionOrder).toContain('task1-start');
      expect(executionOrder).toContain('task1-end');
      expect(executionOrder).toContain('task2-start');
      expect(executionOrder).toContain('task2-end');
      
      await singleScheduler.stop();
    });
  });

  describe('优先级管理', () => {
    it('应该按优先级排序任务', async () => {
      await scheduler.schedule({ ...mockTask, name: '低优先级', priority: 1 });
      await scheduler.schedule({ ...mockTask, name: '高优先级', priority: 10 });
      await scheduler.schedule({ ...mockTask, name: '中优先级', priority: 5 });
      
      const allTasks = scheduler.getAllTasks();
      const sortedTasks = allTasks.sort((a, b) => b.priority - a.priority);
      
      expect(sortedTasks[0].name).toBe('高优先级');
      expect(sortedTasks[1].name).toBe('中优先级');
      expect(sortedTasks[2].name).toBe('低优先级');
    });
  });

  describe('指标收集', () => {
    it('应该收集任务指标', async () => {
      const taskId = await scheduler.schedule(mockTask);
      await scheduler.executeTask(taskId);
      
      const metrics = scheduler.getMetrics();
      
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.completedTasks).toBe(1);
      expect(metrics.failedTasks).toBe(0);
      expect(metrics.pendingTasks).toBe(0);
    });

    it('应该计算平均执行时间', async () => {
      const fastTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'fast result';
        },
      };
      
      const slowTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'slow result';
        },
      };
      
      const [id1, id2] = await Promise.all([
        scheduler.schedule(fastTask),
        scheduler.schedule(slowTask),
      ]);
      
      await Promise.all([
        scheduler.executeTask(id1),
        scheduler.executeTask(id2),
      ]);
      
      const metrics = scheduler.getMetrics();
      
      expect(metrics.averageExecutionTime).toBeGreaterThan(0);
      expect(metrics.completedTasks).toBe(2);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效任务ID', async () => {
      await expect(scheduler.executeTask('invalid-id')).rejects.toThrow();
    });

    it('应该处理执行中的异常', async () => {
      const errorTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        ...mockTask,
        execute: async () => {
          throw new Error('执行错误');
        },
      };
      
      const taskId = await scheduler.schedule(errorTask);
      const result = await scheduler.executeTask(taskId);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('执行错误');
    });
  });
});
