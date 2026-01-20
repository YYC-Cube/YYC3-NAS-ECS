/**
 * @file 健康检查脚本
 * @description 系统健康状态检查
 * @module scripts/health-check.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { logger } from '../src/utils/logger';

/**
 * 健康检查结果
 */
interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message?: string;
  responseTime?: number;
}

/**
 * 健康检查脚本
 */
class HealthCheckScript {
  private services: Array<{
    name: string;
    url: string;
    timeout?: number;
  }> = [];

  /**
   * 添加服务检查
   */
  addService(name: string, url: string, timeout: number = 5000): void {
    this.services.push({ name, url, timeout });
  }

  /**
   * 执行健康检查
   */
  async check(): Promise<void> {
    console.log('🏥 开始健康检查...\n');

    const results: HealthCheckResult[] = [];

    for (const service of this.services) {
      const result = await this.checkService(service);
      results.push(result);
      this.printResult(result);
    }

    // 打印总结
    console.log('\n📊 健康检查总结:');
    const healthy = results.filter(r => r.status === 'healthy').length;
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;
    const warning = results.filter(r => r.status === 'warning').length;

    console.log(`   ✅ 健康: ${healthy}`);
    console.log(`   ⚠️  警告: ${warning}`);
    console.log(`   ❌ 不健康: ${unhealthy}`);

    // 如果有不健康的服务，退出码为1
    if (unhealthy > 0) {
      process.exit(1);
    }
  }

  /**
   * 检查单个服务
   */
  private async checkService(service: {
    name: string;
    url: string;
    timeout?: number;
  }): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          name: service.name,
          status: 'healthy',
          responseTime
        };
      } else {
        return {
          name: service.name,
          status: 'unhealthy',
          message: `HTTP ${response.status}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        name: service.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : String(error),
        responseTime
      };
    }
  }

  /**
   * 打印检查结果
   */
  private printResult(result: HealthCheckResult): void {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'healthy' ? '\x1b[32m' : result.status === 'warning' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `${color}${icon} ${result.name}${reset} ${result.responseTime ? `(${result.responseTime}ms)` : ''}`
    );

    if (result.message) {
      console.log(`   ${result.message}`);
    }
  }
}

// ================== 主程序 ==================

const healthCheckScript = new HealthCheckScript();

// 添加服务检查
healthCheckScript.addService('Backend API', 'http://localhost:8080/health', 5000);
healthCheckScript.addService('Frontend', 'http://localhost:3000', 5000);
healthCheckScript.addService('Database', 'http://localhost:5432', 3000);

// 执行健康检查
healthCheckScript.check();
