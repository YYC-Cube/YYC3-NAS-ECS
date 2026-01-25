import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModuleProgress } from './ModuleProgress';

describe('ModuleProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染标签和进度条', () => {
      render(
        <ModuleProgress 
          label="测试标签" 
          value={50} 
        />
      );

      expect(screen.getByText('测试标签')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('应该渲染进度条容器', () => {
      const { container } = render(
        <ModuleProgress 
          label="进度条" 
          value={75} 
        />
      );

      const progressBar = container.querySelector('.h-2.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('应该渲染进度条填充', () => {
      const { container } = render(
        <ModuleProgress 
          label="进度条" 
          value={60} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Props传递', () => {
    it('应该正确传递label prop', () => {
      render(
        <ModuleProgress 
          label="自定义标签" 
          value={50} 
        />
      );

      expect(screen.getByText('自定义标签')).toBeInTheDocument();
    });

    it('应该正确传递value prop', () => {
      render(
        <ModuleProgress 
          label="标签" 
          value={75} 
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('应该正确传递showPercentage prop为true', () => {
      render(
        <ModuleProgress 
          label="标签" 
          value={50} 
          showPercentage={true}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('应该正确传递showPercentage prop为false', () => {
      render(
        <ModuleProgress 
          label="标签" 
          value={50} 
          showPercentage={false}
        />
      );

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('应该默认showPercentage为true', () => {
      render(
        <ModuleProgress 
          label="标签" 
          value={50} 
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('不同进度值', () => {
    it('应该正确显示0%进度', () => {
      render(
        <ModuleProgress 
          label="零进度" 
          value={0} 
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('应该正确显示50%进度', () => {
      render(
        <ModuleProgress 
          label="半进度" 
          value={50} 
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('应该正确显示80%进度', () => {
      render(
        <ModuleProgress 
          label="高进度" 
          value={80} 
        />
      );

      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('应该正确显示100%进度', () => {
      render(
        <ModuleProgress 
          label="满进度" 
          value={100} 
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('应该正确显示小数进度值', () => {
      render(
        <ModuleProgress 
          label="小数进度" 
          value={75.5} 
        />
      );

      expect(screen.getByText('75.5%')).toBeInTheDocument();
    });
  });

  describe('高值行为', () => {
    it('应该在值大于80时应用高值样式', async () => {
      const { container } = render(
        <ModuleProgress 
          label="高值" 
          value={81} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      });
    });

    it('应该在值等于80时应用高值样式', async () => {
      const { container } = render(
        <ModuleProgress 
          label="临界值" 
          value={80} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      });
    });

    it('应该在值小于80时应用正常样式', async () => {
      const { container } = render(
        <ModuleProgress 
          label="正常值" 
          value={79} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      });
    });

    it('应该在值等于0时应用正常样式', async () => {
      const { container } = render(
        <ModuleProgress 
          label="零值" 
          value={0} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      });
    });
  });

  describe('百分比显示', () => {
    it('应该在showPercentage为true时显示百分比', () => {
      render(
        <ModuleProgress 
          label="显示百分比" 
          value={50} 
          showPercentage={true}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('应该在showPercentage为false时不显示百分比', () => {
      render(
        <ModuleProgress 
          label="隐藏百分比" 
          value={50} 
          showPercentage={false}
        />
      );

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('应该在不同进度值下正确显示百分比', () => {
      const { rerender } = render(
        <ModuleProgress 
          label="进度" 
          value={25} 
        />
      );

      expect(screen.getByText('25%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={50} 
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={75} 
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理空标签', () => {
      render(
        <ModuleProgress 
          label="" 
          value={50} 
        />
      );

      const labelElement = screen.queryByText('');
      expect(labelElement).toBeInTheDocument();
    });

    it('应该处理长标签', () => {
      const longLabel = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常长的标签';

      render(
        <ModuleProgress 
          label={longLabel} 
          value={50} 
        />
      );

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('应该处理特殊字符标签', () => {
      const specialLabel = '标签 <>&"\' 特殊字符';

      render(
        <ModuleProgress 
          label={specialLabel} 
          value={50} 
        />
      );

      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });

    it('应该处理负值进度', () => {
      render(
        <ModuleProgress 
          label="负值" 
          value={-10} 
        />
      );

      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('应该处理超过100的进度值', () => {
      render(
        <ModuleProgress 
          label="超值" 
          value={150} 
        />
      );

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('应该处理小数进度值', () => {
      render(
        <ModuleProgress 
          label="小数" 
          value={33.33} 
        />
      );

      expect(screen.getByText('33.33%')).toBeInTheDocument();
    });
  });

  describe('动画效果', () => {
    it('应该有初始宽度动画', async () => {
      const { container } = render(
        <ModuleProgress 
          label="动画" 
          value={50} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      }, { timeout: 600 });
    });

    it('应该在高值时有闪烁动画', async () => {
      const { container } = render(
        <ModuleProgress 
          label="高值动画" 
          value={85} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      }, { timeout: 2100 });
    });

    it('应该在正常值时无闪烁动画', async () => {
      const { container } = render(
        <ModuleProgress 
          label="正常动画" 
          value={50} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toBeInTheDocument();

      await waitFor(() => {
        expect(progressFill).toBeInTheDocument();
      }, { timeout: 600 });
    });
  });

  describe('样式', () => {
    it('应该应用正确的容器样式', () => {
      const { container } = render(
        <ModuleProgress 
          label="样式测试" 
          value={50} 
        />
      );

      const progressBar = container.querySelector('.h-2.rounded-full');
      expect(progressBar).toHaveClass('h-2', 'rounded-full', 'overflow-hidden');
    });

    it('应该应用圆角样式', () => {
      const { container } = render(
        <ModuleProgress 
          label="圆角测试" 
          value={50} 
        />
      );

      const progressBar = container.querySelector('.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('应该应用溢出隐藏样式', () => {
      const { container } = render(
        <ModuleProgress 
          label="溢出测试" 
          value={50} 
        />
      );

      const progressBar = container.querySelector('.overflow-hidden');
      expect(progressBar).toBeInTheDocument();
    });

    it('应该应用填充样式', () => {
      const { container } = render(
        <ModuleProgress 
          label="填充测试" 
          value={50} 
        />
      );

      const progressFill = container.querySelector('.h-full.rounded-full');
      expect(progressFill).toHaveClass('h-full', 'rounded-full', 'relative');
    });
  });

  describe('可访问性', () => {
    it('应该正确显示标签文本', () => {
      render(
        <ModuleProgress 
          label="可访问性标签" 
          value={50} 
        />
      );

      expect(screen.getByText('可访问性标签')).toBeInTheDocument();
    });

    it('应该正确显示百分比文本', () => {
      render(
        <ModuleProgress 
          label="标签" 
          value={50} 
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('应该在隐藏百分比时不显示百分比文本', () => {
      render(
        <ModuleProgress 
          label="标签" 
          value={50} 
          showPercentage={false}
        />
      );

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });

  describe('响应式行为', () => {
    it('应该在不同进度值下正确渲染', () => {
      const { rerender } = render(
        <ModuleProgress 
          label="进度" 
          value={0} 
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={25} 
        />
      );

      expect(screen.getByText('25%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={50} 
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={75} 
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={100} 
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('应该在不同showPercentage值下正确渲染', () => {
      const { rerender } = render(
        <ModuleProgress 
          label="进度" 
          value={50} 
          showPercentage={true}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(
        <ModuleProgress 
          label="进度" 
          value={50} 
          showPercentage={false}
        />
      );

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });
});
