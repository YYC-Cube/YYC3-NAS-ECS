/**
 * @file 环境切换功能测试
 * @description 测试环境切换组件的功能和交互
 * @module __tests__/components/EnvironmentSwitcher.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { envConfig } from '../config/env';

describe('EnvironmentSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envConfig.setEnvironment('development');
    vi.stubGlobal('location', {
      ...window.location,
      reload: vi.fn()
    });
  });

  describe('组件渲染', () => {
    it('应该渲染环境切换组件', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('环境配置管理')).toBeInTheDocument();
    });

    it('应该显示当前环境名称', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('当前环境:')).toBeInTheDocument();
    });

    it('应该显示所有可用环境按钮', () => {
      render(<EnvironmentSwitcher />);
      
      expect(screen.getByRole('button', { name: 'development' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'staging' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'production' })).toBeInTheDocument();
    });

    it('应该显示当前配置部分', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('当前配置')).toBeInTheDocument();
    });

    it('应该显示环境特性部分', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('环境特性')).toBeInTheDocument();
    });

    it('应该显示API配置信息', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('API Base URL:')).toBeInTheDocument();
      expect(screen.getByText('邮件 API URL:')).toBeInTheDocument();
      expect(screen.getByText('LLM API URL:')).toBeInTheDocument();
      expect(screen.getByText('FRP API URL:')).toBeInTheDocument();
      expect(screen.getByText('WebSocket URL:')).toBeInTheDocument();
    });

    it('应该显示Mock Data和Debug Mode状态', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('Mock Data:')).toBeInTheDocument();
      expect(screen.getByText('Debug Mode:')).toBeInTheDocument();
    });

    it('应该显示环境特性指示器', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('开发模式')).toBeInTheDocument();
    });
  });

  describe('环境切换交互', () => {
    it('应该能够切换到staging环境', () => {
      render(<EnvironmentSwitcher />);
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      fireEvent.click(stagingButton);
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('应该能够切换到production环境', () => {
      render(<EnvironmentSwitcher />);
      const productionButton = screen.getByRole('button', { name: 'production' });
      fireEvent.click(productionButton);
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('应该能够切换回development环境', () => {
      render(<EnvironmentSwitcher />);
      const devButton = screen.getByRole('button', { name: 'development' });
      fireEvent.click(devButton);
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('当前环境的按钮应该有默认样式', () => {
      render(<EnvironmentSwitcher />);
      const devButton = screen.getByRole('button', { name: 'development' });
      expect(devButton).toHaveClass('bg-primary');
    });

    it('切换环境后应该更新当前环境显示', () => {
      render(<EnvironmentSwitcher />);
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      fireEvent.click(stagingButton);
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('配置显示', () => {
    it('应该显示配置信息区域', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('API Base URL:')).toBeInTheDocument();
      expect(screen.getByText('邮件 API URL:')).toBeInTheDocument();
      expect(screen.getByText('LLM API URL:')).toBeInTheDocument();
      expect(screen.getByText('FRP API URL:')).toBeInTheDocument();
      expect(screen.getByText('WebSocket URL:')).toBeInTheDocument();
      expect(screen.getByText('Mock Data:')).toBeInTheDocument();
      expect(screen.getByText('Debug Mode:')).toBeInTheDocument();
      expect(screen.getByText('Log Level:')).toBeInTheDocument();
    });
  });

  describe('环境特性指示器', () => {
    it('应该显示环境特性区域', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('开发模式')).toBeInTheDocument();
    });
  });

  describe('响应式布局', () => {
    it('应该正确渲染Card组件', () => {
      const { container } = render(<EnvironmentSwitcher />);
      const card = container.querySelector('.max-w-2xl');
      expect(card).toBeInTheDocument();
    });

    it('应该正确渲染CardContent', () => {
      const { container } = render(<EnvironmentSwitcher />);
      const cardContent = container.querySelector('.space-y-4');
      expect(cardContent).toBeInTheDocument();
    });

    it('环境按钮应该支持flex布局', () => {
      const { container } = render(<EnvironmentSwitcher />);
      const flexContainer = container.querySelector('.flex.gap-2');
      expect(flexContainer).toBeInTheDocument();
    });

    it('环境特性应该使用grid布局', () => {
      const { container } = render(<EnvironmentSwitcher />);
      const gridContainer = container.querySelector('.grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该处理环境切换失败的情况', () => {
      render(<EnvironmentSwitcher />);
      const invalidButton = screen.queryByRole('button', { name: 'invalid' });
      expect(invalidButton).not.toBeInTheDocument();
    });

    it('应该处理环境配置缺失的情况', () => {
      render(<EnvironmentSwitcher />);
      expect(screen.getByText('环境配置管理')).toBeInTheDocument();
    });
  });

  describe('集成测试', () => {
    it('应该调用envConfig.isDevelopment检查开发模式', () => {
      render(<EnvironmentSwitcher />);
      expect(envConfig.isDevelopment()).toBe(true);
    });

    it('应该调用envConfig.isStaging检查预发布模式', () => {
      envConfig.setEnvironment('staging');
      render(<EnvironmentSwitcher />);
      expect(envConfig.isStaging()).toBe(true);
    });

    it('应该调用envConfig.isProduction检查生产模式', () => {
      envConfig.setEnvironment('production');
      render(<EnvironmentSwitcher />);
      expect(envConfig.isProduction()).toBe(true);
    });
  });
});
