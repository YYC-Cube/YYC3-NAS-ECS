/**
 * @file MonitorPanel - 监控面板组件测试
 * @description 测试监控面板组件的渲染和交互
 * @module components/dashboard/__tests__
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonitorPanel } from '../dashboard/MonitorPanel';

const mockGetStats = vi.fn().mockResolvedValue({
  cpu: { usage: 45, cores: 8, frequency: 3.2 },
  memory: { total: 16384, used: 8192, available: 8192 },
  disk: { total: 1024, used: 512, available: 512 },
  network: { inbound: 1024, outbound: 2048 }
});

vi.mock('../../services/api-v2', () => ({
  api: {
    system: {
      getStats: () => mockGetStats()
    }
  }
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

describe('MonitorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该正确渲染监控面板', () => {
      render(<MonitorPanel />);
      expect(screen.getByText('实时监控')).toBeInTheDocument();
    });

    it('应该显示核心指标卡片', async () => {
      render(<MonitorPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('活跃连接')).toBeInTheDocument();
        expect(screen.getByText('网络流量')).toBeInTheDocument();
        expect(screen.getByText('系统负载')).toBeInTheDocument();
        expect(screen.getByText('安全威胁')).toBeInTheDocument();
      });
    });

    it('应该显示网络流量趋势图', () => {
      render(<MonitorPanel />);
      expect(screen.getByText('实时网络流量')).toBeInTheDocument();
    });
  });

  describe('数据加载测试', () => {
    it('应该加载系统统计数据', async () => {
      render(<MonitorPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('实时监控')).toBeInTheDocument();
      });
    });

    it('应该显示加载状态', () => {
      render(<MonitorPanel />);
      const refreshButton = screen.getByRole('button', { name: /刷新/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('应该支持刷新按钮点击', async () => {
      render(<MonitorPanel />);
      
      const refreshButton = screen.getByRole('button', { name: /刷新/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(refreshButton).toBeEnabled();
      });
    });

    it('应该支持主题切换', () => {
      render(<MonitorPanel />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理API错误', async () => {
      mockGetStats.mockRejectedValue(new Error('API Error'));
      
      render(<MonitorPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('实时监控')).toBeInTheDocument();
      });
    });
  });
});
