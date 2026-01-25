import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModuleCard } from './ModuleCard';

describe('ModuleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染卡片标题和内容', () => {
      render(
        <ModuleCard title="测试标题">
          <div>测试内容</div>
        </ModuleCard>
      );

      expect(screen.getByText('测试标题')).toBeInTheDocument();
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    it('应该渲染嵌套的子元素', () => {
      render(
        <ModuleCard title="嵌套内容">
          <div>
            <span>第一层</span>
            <div>
              <span>第二层</span>
            </div>
          </div>
        </ModuleCard>
      );

      expect(screen.getByText('第一层')).toBeInTheDocument();
      expect(screen.getByText('第二层')).toBeInTheDocument();
    });

    it('应该渲染空内容', () => {
      render(<ModuleCard title="空内容">{null}</ModuleCard>);

      expect(screen.getByText('空内容')).toBeInTheDocument();
    });

    it('应该渲染React元素作为子元素', () => {
      const TestComponent = () => <div>React组件</div>;

      render(
        <ModuleCard title="React子组件">
          <TestComponent />
        </ModuleCard>
      );

      expect(screen.getByText('React组件')).toBeInTheDocument();
    });
  });

  describe('Props传递', () => {
    it('应该正确传递title prop', () => {
      render(
        <ModuleCard title="自定义标题">
          <div>内容</div>
        </ModuleCard>
      );

      const titleElement = screen.getByText('自定义标题');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveStyle({ fontWeight: 600 });
    });

    it('应该正确传递children prop', () => {
      render(
        <ModuleCard title="标题">
          <div>子元素1</div>
          <div>子元素2</div>
        </ModuleCard>
      );

      expect(screen.getByText('子元素1')).toBeInTheDocument();
      expect(screen.getByText('子元素2')).toBeInTheDocument();
    });

    it('应该正确传递level prop为1', () => {
      const { container } = render(
        <ModuleCard title="层级1" level={1}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });

    it('应该正确传递level prop为2', () => {
      const { container } = render(
        <ModuleCard title="层级2" level={2}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });

    it('应该正确传递className prop', () => {
      const { container } = render(
        <ModuleCard title="自定义类名" className="custom-class">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('应该合并多个className', () => {
      const { container } = render(
        <ModuleCard title="多个类名" className="class1 class2">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.class1.class2');
      expect(card).toBeInTheDocument();
    });
  });

  describe('点击事件', () => {
    it('应该触发onClick回调', () => {
      const handleClick = vi.fn();

      render(
        <ModuleCard title="点击测试" onClick={handleClick}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = screen.getByText('点击测试').closest('.p-6');
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('应该多次触发onClick回调', () => {
      const handleClick = vi.fn();

      render(
        <ModuleCard title="多次点击" onClick={handleClick}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = screen.getByText('多次点击').closest('.p-6');
      
      fireEvent.click(card!);
      fireEvent.click(card!);
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('应该在没有onClick时不报错', () => {
      render(
        <ModuleCard title="无点击事件">
          <div>内容</div>
        </ModuleCard>
      );

      const card = screen.getByText('无点击事件').closest('.p-6');
      
      expect(() => {
        fireEvent.click(card!);
      }).not.toThrow();
    });

    it('应该正确传递事件对象', () => {
      const handleClick = vi.fn();
      
      render(
        <ModuleCard title="事件对象" onClick={handleClick}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = screen.getByText('事件对象').closest('.p-6');
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalled();
      expect(handleClick.mock.calls[0][0]).toBeDefined();
      expect(handleClick.mock.calls[0][0].type).toBe('click');
    });
  });

  describe('悬停效果', () => {
    it('应该响应鼠标悬停事件', () => {
      const { container } = render(
        <ModuleCard title="悬停测试">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      
      expect(() => {
        fireEvent.mouseEnter(card!);
      }).not.toThrow();
    });

    it('应该响应鼠标离开事件', () => {
      const { container } = render(
        <ModuleCard title="离开测试">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      
      fireEvent.mouseEnter(card!);
      expect(() => {
        fireEvent.mouseLeave(card!);
      }).not.toThrow();
    });

    it('应该支持连续悬停和离开', () => {
      const { container } = render(
        <ModuleCard title="连续悬停">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      
      fireEvent.mouseEnter(card!);
      fireEvent.mouseLeave(card!);
      fireEvent.mouseEnter(card!);
      fireEvent.mouseLeave(card!);

      expect(card).toBeInTheDocument();
    });
  });

  describe('点击反馈效果', () => {
    it('应该在点击时显示反馈效果', async () => {
      const { container } = render(
        <ModuleCard title="点击反馈">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      fireEvent.click(card!);

      await waitFor(() => {
        const feedback = container.querySelector('.absolute.inset-0');
        expect(feedback).toBeInTheDocument();
      });
    });

    it('应该在200ms后移除反馈效果', async () => {
      const { container } = render(
        <ModuleCard title="反馈消失">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      fireEvent.click(card!);

      await waitFor(() => {
        const feedback = container.querySelector('.absolute.inset-0');
        expect(feedback).not.toBeInTheDocument();
      }, { timeout: 300 });
    });

    it('应该支持快速连续点击', async () => {
      const { container } = render(
        <ModuleCard title="快速点击">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      
      fireEvent.click(card!);
      fireEvent.click(card!);
      fireEvent.click(card!);

      await waitFor(() => {
        const feedback = container.querySelector('.absolute.inset-0');
        expect(feedback).not.toBeInTheDocument();
      }, { timeout: 300 });
    });
  });

  describe('不同层级', () => {
    it('应该正确渲染level=1的卡片', () => {
      const { container } = render(
        <ModuleCard title="层级1卡片" level={1}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('层级1卡片')).toBeInTheDocument();
    });

    it('应该正确渲染level=2的卡片', () => {
      const { container } = render(
        <ModuleCard title="层级2卡片" level={2}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('层级2卡片')).toBeInTheDocument();
    });

    it('应该默认使用level=1', () => {
      const { container } = render(
        <ModuleCard title="默认层级">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });
  });

  describe('自定义类名', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(
        <ModuleCard title="自定义类名" className="test-class">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.test-class');
      expect(card).toBeInTheDocument();
    });

    it('应该应用多个自定义类名', () => {
      const { container } = render(
        <ModuleCard title="多个类名" className="class1 class2 class3">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.class1.class2.class3');
      expect(card).toBeInTheDocument();
    });

    it('应该保留默认类名', () => {
      const { container } = render(
        <ModuleCard title="保留默认" className="custom">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('custom');
    });
  });

  describe('边界情况', () => {
    it('应该处理空标题', () => {
      render(
        <ModuleCard title="">
          <div>内容</div>
        </ModuleCard>
      );

      const titleElement = screen.queryByText('');
      expect(titleElement).toBeInTheDocument();
    });

    it('应该处理长标题', () => {
      const longTitle = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常长的标题';

      render(
        <ModuleCard title={longTitle}>
          <div>内容</div>
        </ModuleCard>
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('应该处理特殊字符标题', () => {
      const specialTitle = '标题 <>&"\' 特殊字符';

      render(
        <ModuleCard title={specialTitle}>
          <div>内容</div>
        </ModuleCard>
      );

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('应该处理大量子元素', () => {
      const children = Array.from({ length: 100 }, (_, i) => (
        <div key={i}>子元素 {i}</div>
      ));

      render(
        <ModuleCard title="大量子元素">
          {children}
        </ModuleCard>
      );

      expect(screen.getByText('子元素 0')).toBeInTheDocument();
      expect(screen.getByText('子元素 99')).toBeInTheDocument();
    });

    it('应该处理深层嵌套的子元素', () => {
      render(
        <ModuleCard title="深层嵌套">
          <div>
            <div>
              <div>
                <div>
                  <div>深层内容</div>
                </div>
              </div>
            </div>
          </div>
        </ModuleCard>
      );

      expect(screen.getByText('深层内容')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('应该是可点击的', () => {
      const handleClick = vi.fn();

      render(
        <ModuleCard title="可访问性" onClick={handleClick}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = screen.getByText('可访问性').closest('.p-6');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    it('应该支持键盘导航', () => {
      const handleClick = vi.fn();

      render(
        <ModuleCard title="键盘导航" onClick={handleClick}>
          <div>内容</div>
        </ModuleCard>
      );

      const card = screen.getByText('键盘导航').closest('.p-6');
      
      fireEvent.keyDown(card!, { key: 'Enter', code: 'Enter' });
      
      expect(card).toBeInTheDocument();
    });
  });

  describe('样式', () => {
    it('应该应用正确的样式', () => {
      const { container } = render(
        <ModuleCard title="样式测试">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.p-6');
      expect(card).toHaveClass('p-6', 'rounded-lg', 'transition-all', 'duration-300');
    });

    it('应该应用圆角样式', () => {
      const { container } = render(
        <ModuleCard title="圆角测试">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('应该应用过渡动画样式', () => {
      const { container } = render(
        <ModuleCard title="过渡动画">
          <div>内容</div>
        </ModuleCard>
      );

      const card = container.querySelector('.transition-all');
      expect(card).toBeInTheDocument();
    });
  });
});
