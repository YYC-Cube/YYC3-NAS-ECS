import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogLevel, LogCategory } from '../../types/logs';
import { LogService } from '../logService';

describe('LogService', () => {
  let logService: LogService;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      get length() {
        return Object.keys(localStorageMock).length;
      },
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null)
    };

    logService = new LogService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addLog', () => {
    it('应该成功添加日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      const result = logService.addLog(logEntry);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result.level).toBe(LogLevel.INFO);
      expect(result.message).toBe('测试日志消息');
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    it('应该生成唯一的日志ID', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      const log1 = logService.addLog(logEntry);
      const log2 = logService.addLog(logEntry);

      expect(log1.id).not.toBe(log2.id);
    });

    it('应该自动生成时间戳', () => {
      const beforeTime = new Date().toISOString();
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      const result = logService.addLog(logEntry);
      const afterTime = new Date().toISOString();

      const resultDate = new Date(result.timestamp);
      const beforeDate = new Date(beforeTime);
      const afterDate = new Date(afterTime);

      expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      expect(resultDate.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });

    it('应该支持添加带有可选字段的日志', () => {
      const logEntry = {
        level: LogLevel.ERROR,
        category: LogCategory.API,
        service: 'api-service',
        message: 'API错误',
        userId: 'user-123',
        duration: 1500
      };

      const result = logService.addLog(logEntry);

      expect(result.userId).toBe('user-123');
      expect(result.duration).toBe(1500);
    });

    it('应该在日志数量超过最大值时删除旧日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      for (let i = 0; i < 10050; i++) {
        logService.addLog(logEntry);
      }

      const allLogs = logService.queryLogs({});
      expect(allLogs.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('queryLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功',
          userId: 'user-1'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败',
          userId: 'user-2'
        },
        {
          level: LogLevel.WARN,
          category: LogCategory.DATABASE,
          service: 'db-service',
          message: '数据库连接警告'
        },
        {
          level: LogLevel.DEBUG,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '调试信息'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该返回所有日志当没有筛选条件时', () => {
      const result = logService.queryLogs({});
      expect(result.length).toBe(4);
    });

    it('应该按日志级别筛选', () => {
      const result = logService.queryLogs({ level: LogLevel.ERROR });
      expect(result.length).toBe(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
    });

    it('应该按日志类别筛选', () => {
      const result = logService.queryLogs({ category: LogCategory.SYSTEM });
      expect(result.length).toBe(2);
      expect(result.every((log: any) => log.category === LogCategory.SYSTEM)).toBe(true);
    });

    it('应该按服务名称筛选（不区分大小写）', () => {
      const result = logService.queryLogs({ service: 'AUTH-SERVICE' });
      expect(result.length).toBe(2);
      expect(result.every((log: any) => log.service.toLowerCase().includes('auth-service'))).toBe(true);
    });

    it('应该按时间范围筛选', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      const result = logService.queryLogs({
        startTime: oneHourAgo,
        endTime: oneHourLater
      });

      expect(result.length).toBe(4);
    });

    it('应该按关键词筛选', () => {
      const result = logService.queryLogs({ keyword: '用户' });
      expect(result.length).toBe(1);
      expect(result[0].message).toContain('用户');
    });

    it('应该按用户ID筛选', () => {
      const result = logService.queryLogs({ userId: 'user-1' });
      expect(result.length).toBe(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('应该按执行时长筛选（最小值）', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.API,
        service: 'api-service',
        message: 'API请求',
        duration: 2000
      };
      logService.addLog(logEntry);

      const result = logService.queryLogs({ minDuration: 1500 });
      expect(result.length).toBe(1);
      expect(result[0].duration).toBeGreaterThanOrEqual(1500);
    });

    it('应该按执行时长筛选（最大值）', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.API,
        service: 'api-service',
        message: 'API请求',
        duration: 1000
      };
      logService.addLog(logEntry);

      const result = logService.queryLogs({ maxDuration: 1500 });
      expect(result.length).toBe(1);
      expect(result[0].duration).toBeLessThanOrEqual(1500);
    });

    it('应该按时间戳降序排序', () => {
      const result = logService.queryLogs({});
      for (let i = 0; i < result.length - 1; i++) {
        const timeA = new Date(result[i].timestamp).getTime();
        const timeB = new Date(result[i + 1].timestamp).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    });

    it('应该支持组合筛选条件', () => {
      const result = logService.queryLogs({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'auth-service'
      });
      expect(result.length).toBe(1);
      expect(result[0].level).toBe(LogLevel.INFO);
      expect(result[0].category).toBe(LogCategory.SYSTEM);
      expect(result[0].service).toBe('auth-service');
    });
  });

  describe('exportLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该导出所有日志为CSV格式', () => {
      const result = logService.exportLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(result).toContain('timestamp,level,category,service,message,userId,duration');
      expect(result).toContain('INFO');
      expect(result).toContain('ERROR');
    });

    it('应该导出筛选后的日志', () => {
      const result = logService.exportLogs({ level: LogLevel.INFO }, { format: 'csv', includeDetails: false, compress: false });
      expect(result).toContain('INFO');
      expect(result).not.toContain('ERROR');
    });

    it('应该支持JSON格式导出', () => {
      const result = logService.exportLogs(undefined, { format: 'json', includeDetails: false, compress: false });
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    // it('应该支持Excel格式导出', () => {
    //   const result = logService.exportLogs(undefined, { format: 'excel' });
    //   expect(result).toBeTruthy();
    //   expect(typeof result).toBe('string');
    // });

    // it('应该支持自定义分隔符', () => {
    //   const result = logService.exportLogs(undefined, { format: 'csv', includeDetails: false, compress: false, delimiter: ';' });
    //   expect(result).toContain(';');
    // });

    // it('应该支持包含表头', () => {
    //   const result = logService.exportLogs(undefined, { format: 'csv', includeDetails: false, compress: false, includeHeader: true });
    //   expect(result.split('\n')[0]).toContain('id,timestamp,level');
    // });

    // it('应该支持不包含表头', () => {
    //   const result = logService.exportLogs(undefined, { format: 'csv', includeDetails: false, compress: false, includeHeader: false });
    //   expect(result.split('\n')[0]).not.toContain('id,timestamp,level');
    // });
  });

  describe('downloadLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      document.createElement = vi.fn((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
            style: {}
          } as any;
        }
        return {} as any;
      });
    });

    it.skip('应该下载CSV文件', () => {
      logService.downloadLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it.skip('应该下载JSON文件', () => {
      logService.downloadLogs(undefined, { format: 'json', includeDetails: false, compress: false });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    // it('应该使用自定义文件名', () => {
    //   logService.downloadLogs(undefined, { format: 'csv', includeDetails: false, compress: false, filename: 'custom-logs.csv' });
    //   const link = (document.createElement as any)('a');
    //   expect(link.download).toContain('custom-logs');
    // });

    it.skip('应该清理创建的URL对象', () => {
      logService.downloadLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败'
        },
        {
          level: LogLevel.WARN,
          category: LogCategory.DATABASE,
          service: 'db-service',
          message: '数据库连接警告'
        },
        {
          level: LogLevel.INFO,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求成功'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该返回正确的统计信息', () => {
      const stats = logService.getStats();
      expect(stats.total).toBe(4);
      expect(stats.byLevel.INFO).toBe(2);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.byLevel.WARN).toBe(1);
    });

    it('应该按类别统计', () => {
      const stats = logService.getStats();
      expect(stats.byCategory.SYSTEM).toBe(1);
      expect(stats.byCategory.API).toBe(2);
      expect(stats.byCategory.DATABASE).toBe(1);
    });

    it('应该按服务统计', () => {
      const stats = logService.getStats();
      expect(stats.byService['auth-service']).toBe(1);
      expect(stats.byService['api-service']).toBe(2);
      expect(stats.byService['db-service']).toBe(1);
    });
  });

  describe('clearLogs', () => {
    it('应该清除所有日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      logService.addLog(logEntry);
      expect(logService.queryLogs({}).length).toBe(1);

      logService.clearLogs();
      expect(logService.queryLogs({}).length).toBe(0);
    });

    it('应该清除筛选后的日志', () => {
      const logEntry1 = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'auth-service',
        message: '用户登录成功'
      };

      const logEntry2 = {
        level: LogLevel.ERROR,
        category: LogCategory.API,
        service: 'api-service',
        message: 'API请求失败'
      };

      logService.addLog(logEntry1);
      logService.addLog(logEntry2);

      logService.clearLogs({ level: LogLevel.INFO });
      const remainingLogs = logService.queryLogs({});
      expect(remainingLogs.length).toBe(1);
      expect(remainingLogs[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe('getLogById', () => {
    it('应该根据ID获取日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      const addedLog = logService.addLog(logEntry);
      const foundLog = logService.getLogById(addedLog.id);

      expect(foundLog).toBeDefined();
      expect(foundLog?.id).toBe(addedLog.id);
    });

    it('应该返回false当日志不存在时', () => {
      const foundLog = logService.getLogById('non-existent-id');
      expect(foundLog).toBeUndefined();
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败'
        },
        {
          level: LogLevel.WARN,
          category: LogCategory.DATABASE,
          service: 'db-service',
          message: '数据库连接警告'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该返回所有日志当没有筛选条件时', () => {
      const result = logService.getLogs();
      expect(result.length).toBe(3);
    });

    it('应该返回筛选后的日志', () => {
      const result = logService.getLogs({ level: LogLevel.ERROR });
      expect(result.length).toBe(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
    });

    it('应该支持限制返回数量', () => {
      const result = logService.getLogs({}, 2);
      expect(result.length).toBe(2);
    });

    it('应该按时间戳降序返回日志', () => {
      const result = logService.getLogs();
      for (let i = 0; i < result.length - 1; i++) {
        const timeA = new Date(result[i].timestamp).getTime();
        const timeB = new Date(result[i + 1].timestamp).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    });
  });

  describe('getRecentLogs', () => {
    beforeEach(() => {
      for (let i = 0; i < 150; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志消息 ${i}`
        });
      }
    });

    it('应该返回最近100条日志', () => {
      const result = logService.getRecentLogs();
      expect(result.length).toBe(100);
    });

    it('应该支持自定义返回数量', () => {
      const result = logService.getRecentLogs(50);
      expect(result.length).toBe(50);
    });

    it('应该返回最新的日志', () => {
      const result = logService.getRecentLogs(10);
      expect(result.length).toBe(10);
      expect(result[0].message).toContain('140');
      expect(result[result.length - 1].message).toContain('149');
    });
  });

  describe('getErrorLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败'
        },
        {
          level: LogLevel.FATAL,
          category: LogCategory.DATABASE,
          service: 'db-service',
          message: '数据库致命错误'
        },
        {
          level: LogLevel.WARN,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '警告信息'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该返回所有ERROR和FATAL级别的日志', () => {
      const result = logService.getErrorLogs();
      expect(result.length).toBe(2);
      expect(result.every(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)).toBe(true);
    });

    it('应该支持限制返回数量', () => {
      const result = logService.getErrorLogs(1);
      expect(result.length).toBe(1);
    });

    it('应该返回最新的错误日志', () => {
      const result = logService.getErrorLogs(10);
      for (let i = 0; i < result.length - 1; i++) {
        const timeA = new Date(result[i].timestamp).getTime();
        const timeB = new Date(result[i + 1].timestamp).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    });
  });

  describe('searchLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败'
        },
        {
          level: LogLevel.WARN,
          category: LogCategory.DATABASE,
          service: 'db-service',
          message: '数据库连接警告'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该按消息关键词搜索', () => {
      const result = logService.searchLogs('登录');
      expect(result.length).toBe(1);
      expect(result[0].message).toContain('登录');
    });

    it('应该按服务名称搜索', () => {
      const result = logService.searchLogs('api-service');
      expect(result.length).toBe(1);
      expect(result[0].service).toContain('api-service');
    });

    it('应该不区分大小写搜索', () => {
      const result1 = logService.searchLogs('API');
      const result2 = logService.searchLogs('api');
      expect(result1.length).toBe(result2.length);
      expect(result1.length).toBeGreaterThan(0);
    });

    it('应该支持限制返回数量', () => {
      const result = logService.searchLogs('服务', 1);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('应该返回空数组当没有匹配结果时', () => {
      const result = logService.searchLogs('不存在的关键词');
      expect(result.length).toBe(0);
    });
  });

  describe('exportLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        },
        {
          level: LogLevel.ERROR,
          category: LogCategory.API,
          service: 'api-service',
          message: 'API请求失败'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));
    });

    it('应该导出所有日志为CSV格式', () => {
      const result = logService.exportLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(result).toContain('timestamp,level,category,service,message,userId,duration');
      expect(result).toContain('INFO');
      expect(result).toContain('ERROR');
    });

    it('应该导出筛选后的日志', () => {
      const result = logService.exportLogs({ level: LogLevel.INFO }, { format: 'csv', includeDetails: false, compress: false });
      expect(result).toContain('INFO');
      expect(result).not.toContain('ERROR');
    });

    it('应该支持JSON格式导出', () => {
      const result = logService.exportLogs(undefined, { format: 'json', includeDetails: false, compress: false });
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('应该支持TXT格式导出', () => {
      const result = logService.exportLogs(undefined, { format: 'txt', includeDetails: false, compress: false });
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('用户登录成功');
    });

    it('应该默认使用JSON格式', () => {
      const result = logService.exportLogs(undefined);
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('downloadLogs', () => {
    beforeEach(() => {
      const testLogs = [
        {
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'auth-service',
          message: '用户登录成功'
        }
      ];

      testLogs.forEach(log => logService.addLog(log));

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      document.createElement = vi.fn((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
            style: {}
          } as any;
        }
        return {} as any;
      });
    });

    it.skip('应该下载CSV文件', () => {
      logService.downloadLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it.skip('应该下载JSON文件', () => {
      logService.downloadLogs(undefined, { format: 'json', includeDetails: false, compress: false });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it.skip('应该清理创建的URL对象', () => {
      logService.downloadLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('deleteLog', () => {
    it('应该删除指定ID的日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志消息'
      };

      const addedLog = logService.addLog(logEntry);
      const deleted = logService.deleteLog(addedLog.id);

      expect(deleted).toBe(true);
      expect(logService.getLogById(addedLog.id)).toBeUndefined();
    });

    it('应该返回false当日志不存在时', () => {
      const deleted = logService.deleteLog('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('应该正确删除多条日志', () => {
      const logs = [];
      for (let i = 0; i < 5; i++) {
        const log = logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志 ${i}`
        });
        logs.push(log);
      }

      logService.deleteLog(logs[2].id);
      logService.deleteLog(logs[4].id);

      const remaining = logService.getLogs();
      expect(remaining.length).toBe(3);
      expect(remaining.find(l => l.id === logs[2].id)).toBeUndefined();
      expect(remaining.find(l => l.id === logs[4].id)).toBeUndefined();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空日志列表', () => {
      logService.clearLogs();
      const result = logService.queryLogs({});
      expect(result.length).toBe(0);
    });

    it('应该处理超长消息', () => {
      const longMessage = 'A'.repeat(10000);
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: longMessage
      };

      const result = logService.addLog(logEntry);
      expect(result.message).toBe(longMessage);
    });

    it('应该处理特殊字符', () => {
      const specialMessage = '测试消息: <script>alert("XSS")</script> & "quotes" \'apostrophes\' \n\t\r';
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: specialMessage
      };

      const result = logService.addLog(logEntry);
      expect(result.message).toBe(specialMessage);
    });

    it('应该处理Unicode字符', () => {
      const unicodeMessage = '测试消息 🎉 Emoji 中文 日本語 한국어 العربية';
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: unicodeMessage
      };

      const result = logService.addLog(logEntry);
      expect(result.message).toBe(unicodeMessage);
    });

    it('应该处理极短时间范围', () => {
      const now = new Date();
      const oneMsAgo = new Date(now.getTime() - 1).toISOString();
      const oneMsLater = new Date(now.getTime() + 1).toISOString();

      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      logService.addLog(logEntry);

      const result = logService.queryLogs({
        startTime: oneMsAgo,
        endTime: oneMsLater
      });

      expect(result.length).toBe(1);
    });

    it('应该处理空关键词搜索', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      logService.addLog(logEntry);

      const result = logService.searchLogs('');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('应该处理空筛选条件', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      logService.addLog(logEntry);

      const result = logService.queryLogs({});
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效的时间戳格式', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      logService.addLog(logEntry);

      const result = logService.queryLogs({
        startTime: 'invalid-date'
      });

      expect(result).toBeDefined();
    });

    it('应该处理null和undefined参数', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      logService.addLog(logEntry);

      expect(() => logService.queryLogs(null as any)).toThrow();
      expect(() => logService.getLogs(undefined as any)).not.toThrow();
    });

    it('应该处理导出空日志', () => {
      logService.clearLogs();

      const jsonResult = logService.exportLogs(undefined, { format: 'json', includeDetails: false, compress: false });
      expect(jsonResult).toBe('[]');

      const csvResult = logService.exportLogs(undefined, { format: 'csv', includeDetails: false, compress: false });
      expect(csvResult).toContain('timestamp,level,category,service,message,userId,duration');

      const txtResult = logService.exportLogs(undefined, { format: 'txt', includeDetails: false, compress: false });
      expect(txtResult).toBe('');
    });

    it('应该处理获取不存在日志的统计', () => {
      logService.clearLogs();
      const stats = logService.getStats();
      expect(stats.total).toBe(0);
      expect(stats.errorRate).toBe(0);
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量日志', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志 ${i}`
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('应该高效查询大量日志', () => {
      for (let i = 0; i < 1000; i++) {
        logService.addLog({
          level: i % 5 === 0 ? LogLevel.ERROR : LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志 ${i}`
        });
      }

      const startTime = Date.now();
      const result = logService.queryLogs({ level: LogLevel.ERROR });
      const endTime = Date.now();

      expect(result.length).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('应该高效搜索大量日志', () => {
      for (let i = 0; i < 1000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志 ${i}`
        });
      }

      const startTime = Date.now();
      const result = logService.searchLogs('测试');
      const endTime = Date.now();

      expect(result.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('并发操作测试', () => {
    it('应该正确处理并发添加日志', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() =>
            logService.addLog({
              level: LogLevel.INFO,
              category: LogCategory.SYSTEM,
              service: 'test-service',
              message: `并发日志 ${i}`
            })
          )
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(100);

      const allLogs = logService.getLogs();
      expect(allLogs.length).toBeGreaterThanOrEqual(100);
    });

    it('应该正确处理并发查询', async () => {
      for (let i = 0; i < 100; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志 ${i}`
        });
      }

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() =>
            logService.queryLogs({ level: LogLevel.INFO })
          )
        );
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.length).toBe(100);
      });
    });
  });

  describe('localStorage不可用情况测试', () => {
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalLocalStorage = global.localStorage;
      Object.defineProperty(global, 'localStorage', {
        value: null,
        writable: true
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });

    it('应该在localStorage不可用时仍然可以添加日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      const result = logService.addLog(logEntry);
      expect(result).toBeDefined();
      expect(result.message).toBe('测试日志');
    });

    it('应该在localStorage不可用时仍然可以查询日志', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '测试日志'
      };

      logService.addLog(logEntry);
      const result = logService.queryLogs({});
      expect(result.length).toBe(1);
    });
  });

  describe('数据验证测试', () => {
    it('应该正确处理所有日志级别', () => {
      const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

      levels.forEach(level => {
        logService.addLog({
          level,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `${level} 日志`
        });
      });

      const stats = logService.getStats();
      expect(stats.byLevel[LogLevel.DEBUG]).toBe(1);
      expect(stats.byLevel[LogLevel.INFO]).toBe(1);
      expect(stats.byLevel[LogLevel.WARN]).toBe(1);
      expect(stats.byLevel[LogLevel.ERROR]).toBe(1);
      expect(stats.byLevel[LogLevel.FATAL]).toBe(1);
    });

    it('应该正确处理所有日志类别', () => {
      const categories = [
        LogCategory.SYSTEM,
        LogCategory.AUTH,
        LogCategory.API,
        LogCategory.DATABASE,
        LogCategory.EMAIL,
        LogCategory.FRP,
        LogCategory.DDNS,
        LogCategory.LLM,
        LogCategory.BACKUP,
        LogCategory.MONITORING
      ];

      categories.forEach(category => {
        logService.addLog({
          level: LogLevel.INFO,
          category,
          service: 'test-service',
          message: `${category} 日志`
        });
      });

      const stats = logService.getStats();
      categories.forEach(category => {
        expect(stats.byCategory[category]).toBe(1);
      });
    });

    it('应该正确计算平均持续时间', () => {
      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.API,
        service: 'test-service',
        message: '测试日志1',
        duration: 100
      });

      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.API,
        service: 'test-service',
        message: '测试日志2',
        duration: 200
      });

      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.API,
        service: 'test-service',
        message: '测试日志3',
        duration: 300
      });

      const stats = logService.getStats();
      expect(stats.avgDuration).toBe(200);
    });

    it('应该正确计算错误率', () => {
      for (let i = 0; i < 10; i++) {
        logService.addLog({
          level: i < 2 ? LogLevel.ERROR : LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'test-service',
          message: `测试日志 ${i}`
        });
      }

      const stats = logService.getStats();
      expect(stats.errorRate).toBe(20);
    });
  });
});
