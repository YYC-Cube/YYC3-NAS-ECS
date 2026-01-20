/**
 * @file logger.test.ts - Logger单元测试
 * @description YYC³ MovAISys 智能浮窗系统 - 测试文件
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    // 创建Logger实例，禁用文件输出
    logger = new Logger({
      level: LogLevel.DEBUG,
      format: 'json',
      console: true,
      file: {
        enabled: false
      }
    });

    // Mock console.log
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('基础功能', () => {
    it('应该正确创建Logger实例', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('应该正确记录INFO日志', () => {
      logger.info('Test message');

      expect(consoleSpy).toHaveBeenCalled();
      const callArgs = consoleSpy.mock.calls[0][0];
      expect(callArgs).toContain('INFO');
      expect(callArgs).toContain('Test message');
    });

    it('应该正确记录ERROR日志', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', 'TestContext', {}, error);

      expect(consoleSpy).toHaveBeenCalled();
      const callArgs = consoleSpy.mock.calls[0][0];
      expect(callArgs).toContain('ERROR');
      expect(callArgs).toContain('Error occurred');
      expect(callArgs).toContain('Test error');
    });
  });

  describe('日志级别过滤', () => {
    it('应该过滤低于当前级别的日志', () => {
      const loggerWarn = new Logger({ level: LogLevel.WARN });

      loggerWarn.debug('Debug message'); // 不应输出
      loggerWarn.info('Info message');   // 不应输出
      loggerWarn.warn('Warn message');   // 应输出

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('格式化', () => {
    it('应该输出JSON格式', () => {
      const loggerJson = new Logger({ level: LogLevel.INFO, format: 'json' });

      loggerJson.info('JSON test');

      const output = consoleSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow(); // 验证是合法JSON
    });

    it('应该输出文本格式', () => {
      const loggerText = new Logger({ level: LogLevel.INFO, format: 'text' });

      loggerText.info('Text test');

      const output = consoleSpy.mock.calls[0][0];
      expect(typeof output).toBe('string');
    });
  });

  describe('元数据', () => {
    it('应该正确包含元数据', () => {
      const metadata = { userId: 123, action: 'test' };
      logger.info('Message with metadata', 'Context', metadata);

      expect(consoleSpy).toHaveBeenCalled();
      const callArgs = consoleSpy.mock.calls[0][0];
      expect(callArgs).toContain('userId');
      expect(callArgs).toContain('123');
    });
  });
});
