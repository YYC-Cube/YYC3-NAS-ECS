/**
 * @file 环境切换功能测试
 * @description 测试环境切换组件的功能和交互
 * @module __tests__/components/EnvironmentSwitcher.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { envConfig } from '../config/env';

describe('EnvironmentSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envConfig.setEnvironment('development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect(screen.getByText('Mail API URL:')).toBeInTheDocument();
      expect(screen.getByText('LLM API URL:')).toBeInTheDocument();
      expect(screen.getByText('FRP API URL:')).toBeInTheDocument();
      expect(screen.getByText('WebSocket URL:')).toBeInTheDocument();
    });

    it('应该显示Mock Data和Debug Mode状态', () => {
      render(<EnvironmentSwitcher />);
      
      expect(screen.getByText('Mock Data:')).toBeInTheDocument();
      expect(screen.getByText('Debug Mode:')).toBeInTheDocument();
      expect(screen.getByText('Log Level:')).toBeInTheDocument();
    });

    it('应该显示环境特性指示器', () => {
      render(<EnvironmentSwitcher />);
      
      expect(screen.getByText('开发模式')).toBeInTheDocument();
      expect(screen.getByText('预发布')).toBeInTheDocument();
      expect(screen.getByText('生产环境')).toBeInTheDocument();
    });
  });

  describe('环境切换交互', () => {
    it('应该能够切换到staging环境', async () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      
      render(<EnvironmentSwitcher />);
      
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      fireEvent.click(stagingButton);
      
      expect(reloadSpy).toHaveBeenCalled();
      reloadSpy.mockRestore();
    });

    it('应该能够切换到production环境', async () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      
      render(<EnvironmentSwitcher />);
      
      const productionButton = screen.getByRole('button', { name: 'production' });
      fireEvent.click(productionButton);
      
      expect(reloadSpy).toHaveBeenCalled();
      reloadSpy.mockRestore();
    });

    it('应该能够切换回development环境', async () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      
      envConfig.setEnvironment('production');
      render(<EnvironmentSwitcher />);
      
      const developmentButton = screen.getByRole('button', { name: 'development' });
      fireEvent.click(developmentButton);
      
      expect(reloadSpy).toHaveBeenCalled();
      reloadSpy.mockRestore();
    });

    it('当前环境的按钮应该有默认样式', () => {
      envConfig.setEnvironment('development');
      render(<EnvironmentSwitcher />);
      
      const developmentButton = screen.getByRole('button', { name: 'development' });
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      
      expect(developmentButton).toHaveClass('bg-primary');
      expect(stagingButton).not.toHaveClass('bg-primary');
    });

    it('切换环境后应该更新当前环境显示', async () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      
      envConfig.setEnvironment('staging');
      render(<EnvironmentSwitcher />);
      
      const currentEnvBadge = screen.getByText('当前环境:').nextElementSibling;
      expect(currentEnvBadge).toHaveTextContent('staging');
      
      reloadSpy.mockRestore();
    });
  });

  describe('配置显示', () => {
    it('development环境应该显示正确的API URL', () => {
      envConfig.setEnvironment('development');
      render(<EnvironmentSwitcher />);
      
      const apiBaseUrl = screen.getByText('API Base URL:').nextElementSibling;
      expect(apiBaseUrl).toHaveTextContent('http://localhost:6000');
    });

    it('staging环境应该显示正确的API URL', () => {
      envConfig.setEnvironment('staging');
      render(<EnvironmentSwitcher />);
      
      const apiBaseUrl = screen.getByText('API Base URL:').nextElementSibling;
      expect(apiBaseUrl).toHaveTextContent('https://staging-api.0379.email');
    });

    it('production环境应该显示正确的API URL', () => {
      envConfig.setEnvironment('production');
      render(<EnvironmentSwitcher />);
      
      const apiBaseUrl = screen.getByText('API Base URL:').nextElementSibling;
      expect(apiBaseUrl).toHaveTextContent('https://api.0379.email');
    });

    it('development环境应该显示Mock Data为Enabled', () => {
      envConfig.setEnvironment('development');
      render(<EnvironmentSwitcher />);
      
      const mockDataStatus = screen.getByText('Mock Data:').nextElementSibling;
      expect(mockDataStatus).toHaveTextContent('Enabled');
    });

    it('staging环境应该显示Mock Data为Disabled', () => {
      envConfig.setEnvironment('staging');
      render(<EnvironmentSwitcher />);
      
      const mockDataStatus = screen.getByText('Mock Data:').nextElementSibling;
      expect(mockDataStatus).toHaveTextContent('Disabled');
    });

    it('production环境应该显示Mock Data为Disabled', () => {
      envConfig.setEnvironment('production');
      render(<EnvironmentSwitcher />);
      
      const mockDataStatus = screen.getByText('Mock Data:').nextElementSibling;
      expect(mockDataStatus).toHaveTextContent('Disabled');
    });

    it('development环境应该显示Debug Mode为Enabled', () => {
      envConfig.setEnvironment('development');
      render(<EnvironmentSwitcher />);
      
      const debugModeStatus = screen.getByText('Debug Mode:').nextElementSibling;
      expect(debugModeStatus).toHaveTextContent('Enabled');
    });

    it('production环境应该显示Debug Mode为Disabled', () => {
      envConfig.setEnvironment('production');
      render(<EnvironmentSwitcher />);
      
      const debugModeStatus = screen.getByText('Debug Mode:').nextElementSibling;
      expect(debugModeStatus).toHaveTextContent('Disabled');
    });

    it('应该显示正确的日志级别', () => {
      envConfig.setEnvironment('development');
      render(<EnvironmentSwitcher />);
      
      const logLevel = screen.getByText('Log Level:').nextElementSibling;
      expect(logLevel).toHaveTextContent('debug');
    });
  });

  describe('环境特性指示器', () => {
    it('development环境应该显示正确的特性状态', () => {
      envConfig.setEnvironment('development');
      render(<EnvironmentSwitcher />);
      
      const devMode = screen.getByText('开发模式').nextElementSibling;
      const stagingMode = screen.getByText('预发布').nextElementSibling;
      const prodMode = screen.getByText('生产环境').nextElementSibling;
      
      expect(devMode).toHaveTextContent('是');
      expect(stagingMode).toHaveTextContent('否');
      expect(prodMode).toHaveTextContent('否');
    });

    it('staging环境应该显示正确的特性状态', () => {
      envConfig.setEnvironment('staging');
      render(<EnvironmentSwitcher />);
      
      const devMode = screen.getByText('开发模式').nextElementSibling;
      const stagingMode = screen.getByText('预发布').nextElementSibling;
      const prodMode = screen.getByText('生产环境').nextElementSibling;
      
      expect(devMode).toHaveTextContent('否');
      expect(stagingMode).toHaveTextContent('是');
      expect(prodMode).toHaveTextContent('否');
    });

    it('production环境应该显示正确的特性状态', () => {
      envConfig.setEnvironment('production');
      render(<EnvironmentSwitcher />);
      
      const devMode = screen.getByText('开发模式').nextElementSibling;
      const stagingMode = screen.getByText('预发布').nextElementSibling;
      const prodMode = screen.getByText('生产环境').nextElementSibling;
      
      expect(devMode).toHaveTextContent('否');
      expect(stagingMode).toHaveTextContent('否');
      expect(prodMode).toHaveTextContent('是');
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
      const buttonContainer = container.querySelector('.flex.gap-2.flex-wrap');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('环境特性应该使用grid布局', () => {
      const { container } = render(<EnvironmentSwitcher />);
      const gridContainer = container.querySelector('.grid.grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该处理环境切换失败的情况', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      
      vi.spyOn(envConfig, 'setEnvironment').mockReturnValue(false);
      
      render(<EnvironmentSwitcher />);
      
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      fireEvent.click(stagingButton);
      
      expect(reloadSpy).not.toHaveBeenCalled();
      
      reloadSpy.mockRestore();
    });

    it('应该处理环境配置缺失的情况', () => {
      vi.spyOn(envConfig, 'getAllEnvironments').mockReturnValue({});
      
      render(<EnvironmentSwitcher />);
      
      expect(screen.getByText('环境配置管理')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('所有环境按钮应该是可访问的', () => {
      render(<EnvironmentSwitcher />);
      
      const developmentButton = screen.getByRole('button', { name: 'development' });
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      const productionButton = screen.getByRole('button', { name: 'production' });
      
      expect(developmentButton).toBeEnabled();
      expect(stagingButton).toBeEnabled();
      expect(productionButton).toBeEnabled();
    });

    it('应该有清晰的标签和描述', () => {
      render(<EnvironmentSwitcher />);
      
      expect(screen.getByText('可用环境')).toBeInTheDocument();
      expect(screen.getByText('当前配置')).toBeInTheDocument();
      expect(screen.getByText('环境特性')).toBeInTheDocument();
    });
  });

  describe('集成测试', () => {
    it('应该与envConfig正确集成', () => {
      const getCurrentEnvSpy = vi.spyOn(envConfig, 'getCurrentEnvironment');
      
      render(<EnvironmentSwitcher />);
      
      expect(getCurrentEnvSpy).toHaveBeenCalled();
      
      getCurrentEnvSpy.mockRestore();
    });

    it('应该调用envConfig.setEnvironment进行切换', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const setEnvSpy = vi.spyOn(envConfig, 'setEnvironment');
      
      render(<EnvironmentSwitcher />);
      
      const stagingButton = screen.getByRole('button', { name: 'staging' });
      fireEvent.click(stagingButton);
      
      expect(setEnvSpy).toHaveBeenCalledWith('staging');
      
      setEnvSpy.mockRestore();
      reloadSpy.mockRestore();
    });

    it('应该调用envConfig.getAllEnvironments获取环境列表', () => {
      const getAllEnvsSpy = vi.spyOn(envConfig, 'getAllEnvironments');
      
      render(<EnvironmentSwitcher />);
      
      expect(getAllEnvsSpy).toHaveBeenCalled();
      
      getAllEnvsSpy.mockRestore();
    });

    it('应该调用envConfig.isDevelopment检查开发模式', () => {
      const isDevSpy = vi.spyOn(envConfig, 'isDevelopment');
      
      render(<EnvironmentSwitcher />);
      
      expect(isDevSpy).toHaveBeenCalled();
      
      isDevSpy.mockRestore();
    });

    it('应该调用envConfig.isStaging检查预发布模式', () => {
      const isStagingSpy = vi.spyOn(envConfig, 'isStaging');
      
      render(<EnvironmentSwitcher />);
      
      expect(isStagingSpy).toHaveBeenCalled();
      
      isStagingSpy.mockRestore();
    });

    it('应该调用envConfig.isProduction检查生产模式', () => {
      const isProdSpy = vi.spyOn(envConfig, 'isProduction');
      
      render(<EnvironmentSwitcher />);
      
      expect(isProdSpy).toHaveBeenCalled();
      
      isProdSpy.mockRestore();
    });
  });
});
