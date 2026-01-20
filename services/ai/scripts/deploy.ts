/**
 * @file 部署脚本
 * @description 自动化部署脚本
 * @module scripts/deploy.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * 部署配置
 */
interface DeployConfig {
  environment: 'development' | 'production';
  buildDir: string;
  distDir: string;
  dockerComposeFile: string;
}

/**
 * 部署脚本
 */
class DeployScript {
  private config: DeployConfig;

  constructor(config: DeployConfig) {
    this.config = config;
  }

  /**
   * 执行部署
   */
  async deploy(): Promise<void> {
    console.log(`🚀 开始部署到 ${this.config.environment} 环境...\n`);

    try {
      // 1. 清理旧的构建文件
      this.clean();

      // 2. 安装依赖
      await this.installDependencies();

      // 3. 构建项目
      await this.build();

      // 4. 运行测试
      await this.test();

      // 5. 构建Docker镜像
      await this.buildDocker();

      // 6. 部署
      await this.deployToEnvironment();

      console.log('\n✅ 部署完成！');
    } catch (error) {
      console.error('\n❌ 部署失败:', error);
      process.exit(1);
    }
  }

  /**
   * 清理旧的构建文件
   */
  private clean(): void {
    console.log('🧹 清理旧的构建文件...');

    const dirs = [
      this.config.distDir,
      this.config.buildDir
    ];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`   ✓ 已删除: ${dir}`);
      }
    }

    console.log('');
  }

  /**
   * 安装依赖
   */
  private async installDependencies(): Promise<void> {
    console.log('📦 安装依赖...');

    try {
      execSync('bun install', { stdio: 'inherit' });
      console.log('   ✓ 依赖安装完成\n');
    } catch (error) {
      throw new Error('依赖安装失败');
    }
  }

  /**
   * 构建项目
   */
  private async build(): Promise<void> {
    console.log('🔨 构建项目...');

    try {
      execSync('bun run build', { stdio: 'inherit' });
      console.log('   ✓ 构建完成\n');
    } catch (error) {
      throw new Error('构建失败');
    }
  }

  /**
   * 运行测试
   */
  private async test(): Promise<void> {
    console.log('🧪 运行测试...');

    try {
      execSync('bun run test', { stdio: 'inherit' });
      console.log('   ✓ 测试通过\n');
    } catch (error) {
      console.warn('   ⚠️  测试失败，继续部署...\n');
    }
  }

  /**
   * 构建Docker镜像
   */
  private async buildDocker(): Promise<void> {
    console.log('🐳 构建Docker镜像...');

    try {
      const imageName = `yyc3-mobile-ai:${this.config.environment}`;

      execSync(
        `docker build -f Dockerfile.backend -t ${imageName} .`,
        { stdio: 'inherit' }
      );

      console.log(`   ✓ 镜像构建完成: ${imageName}\n`);
    } catch (error) {
      throw new Error('Docker镜像构建失败');
    }
  }

  /**
   * 部署到环境
   */
  private async deployToEnvironment(): Promise<void> {
    console.log(`🚀 部署到 ${this.config.environment} 环境...`);

    try {
      execSync(
        `docker-compose -f ${this.config.dockerComposeFile} up -d`,
        { stdio: 'inherit' }
      );

      console.log(`   ✓ 部署完成\n`);
    } catch (error) {
      throw new Error('部署失败');
    }
  }
}

// ================== 主程序 ==================

// 从命令行参数获取环境
const environment = (process.env.NODE_ENV || 'development') as 'development' | 'production';

// 配置部署脚本
const config: DeployConfig = {
  environment,
  buildDir: 'dist',
  distDir: 'dist',
  dockerComposeFile: environment === 'production'
    ? 'docker-compose.prod.yml'
    : 'docker-compose.dev.yml'
};

// 执行部署
const deployScript = new DeployScript(config);
deployScript.deploy();
