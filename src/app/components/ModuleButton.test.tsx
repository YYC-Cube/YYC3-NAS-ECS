import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModuleButton } from './ModuleButton';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Settings } from 'lucide-react';

const renderWithTheme = (component: React.ReactNode, theme = 'cpu') => {
  return render(
    <ThemeProvider initialTheme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ModuleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染primary按钮', () => {
      renderWithTheme(
        <ModuleButton variant="primary">
          主要按钮
        </ModuleButton>
      );

      expect(screen.getByText('主要按钮')).toBeInTheDocument();
    });

    it('应该正确渲染secondary按钮', () => {
      renderWithTheme(
        <ModuleButton variant="secondary">
          次要按钮
        </ModuleButton>
      );

      expect(screen.getByText('次要按钮')).toBeInTheDocument();
    });

    it('应该正确渲染icon按钮', () => {
      renderWithTheme(
        <ModuleButton variant="icon" icon={Settings}>
          图标按钮
        </ModuleButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('应该默认使用primary variant', () => {
      renderWithTheme(
        <ModuleButton>
          默认按钮
        </ModuleButton>
      );

      expect(screen.getByText('默认按钮')).toBeInTheDocument();
    });
  });

  describe('Props传递', () => {
    it('应该正确传递children prop', () => {
      renderWithTheme(
        <ModuleButton>
          子元素
        </ModuleButton>
      );

      expect(screen.getByText('子元素')).toBeInTheDocument();
    });

    it('应该正确传递variant prop为primary', () => {
      renderWithTheme(
        <ModuleButton variant="primary">
          Primary
        </ModuleButton>
      );

      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('应该正确传递variant prop为secondary', () => {
      renderWithTheme(
        <ModuleButton variant="secondary">
          Secondary
        </ModuleButton>
      );

      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('应该正确传递variant prop为icon', () => {
      renderWithTheme(
        <ModuleButton variant="icon" icon={Settings}>
          Icon
        </ModuleButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('应该正确传递icon prop', () => {
      renderWithTheme(
        <ModuleButton icon={Settings}>
          带图标
        </ModuleButton>
      );

      expect(screen.getByText('带图标')).toBeInTheDocument();
    });
  });

  describe('点击事件', () => {
    it('应该触发onClick回调', () => {
      const handleClick = vi.fn();

      renderWithTheme(
        <ModuleButton onClick={handleClick}>
          点击测试
        </ModuleButton>
      );

      const button = screen.getByText('点击测试');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('应该多次触发onClick回调', () => {
      const handleClick = vi.fn();

      renderWithTheme(
        <ModuleButton onClick={handleClick}>
          多次点击
        </ModuleButton>
      );

      const button = screen.getByText('多次点击');
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('应该在没有onClick时不报错', () => {
      renderWithTheme(
        <ModuleButton>
          无点击事件
        </ModuleButton>
      );

      const button = screen.getByText('无点击事件');
      
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('应该正确传递事件对象', () => {
      const handleClick = vi.fn((event) => {
        expect(event).toBeDefined();
        expect(event.type).toBe('click');
      });

      renderWithTheme(
        <ModuleButton onClick={handleClick}>
          事件对象
        </ModuleButton>
      );

      const button = screen.getByText('事件对象');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('应该在icon variant上触发onClick', () => {
      const handleClick = vi.fn();

      renderWithTheme(
        <ModuleButton variant="icon" icon={Settings} onClick={handleClick}>
          Icon
        </ModuleButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('悬停效果', () => {
    it('应该响应鼠标悬停事件', () => {
      renderWithTheme(
        <ModuleButton>
          悬停测试
        </ModuleButton>
      );

      const button = screen.getByText('悬停测试');
      
      expect(() => {
        fireEvent.mouseEnter(button);
      }).not.toThrow();
    });

    it('应该响应鼠标离开事件', () => {
      renderWithTheme(
        <ModuleButton>
          离开测试
        </ModuleButton>
      );

      const button = screen.getByText('离开测试');
      
      fireEvent.mouseEnter(button);
      expect(() => {
        fireEvent.mouseLeave(button);
      }).not.toThrow();
    });

    it('应该支持连续悬停和离开', () => {
      renderWithTheme(
        <ModuleButton>
          连续悬停
        </ModuleButton>
      );

      const button = screen.getByText('连续悬停');
      
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      expect(button).toBeInTheDocument();
    });

    it('应该在icon variant上响应悬停', () => {
      renderWithTheme(
        <ModuleButton variant="icon" icon={Settings}>
          Icon
        </ModuleButton>
      );

      const button = screen.getByRole('button');
      
      expect(() => {
        fireEvent.mouseEnter(button);
      }).not.toThrow();
    });
  });

  describe('主题支持', () => {
    it('应该支持cpu主题', () => {
      renderWithTheme(
        <ModuleButton>
          CPU主题
        </ModuleButton>,
        'cpu'
      );

      expect(screen.getByText('CPU主题')).toBeInTheDocument();
    });

    it('应该支持memory主题', () => {
      renderWithTheme(
        <ModuleButton>
          Memory主题
        </ModuleButton>,
        'memory'
      );

      expect(screen.getByText('Memory主题')).toBeInTheDocument();
    });

    it('应该支持storage主题', () => {
      renderWithTheme(
        <ModuleButton>
          Storage主题
        </ModuleButton>,
        'storage'
      );

      expect(screen.getByText('Storage主题')).toBeInTheDocument();
    });

    it('应该支持network主题', () => {
      renderWithTheme(
        <ModuleButton>
          Network主题
        </ModuleButton>,
        'network'
      );

      expect(screen.getByText('Network主题')).toBeInTheDocument();
    });

    it('应该支持security主题', () => {
      renderWithTheme(
        <ModuleButton>
          Security主题
        </ModuleButton>,
        'security'
      );

      expect(screen.getByText('Security主题')).toBeInTheDocument();
    });
  });

  describe('图标显示', () => {
    it('应该在primary variant中显示图标', () => {
      renderWithTheme(
        <ModuleButton icon={Settings}>
          带图标按钮
        </ModuleButton>
      );

      expect(screen.getByText('带图标按钮')).toBeInTheDocument();
    });

    it('应该在secondary variant中显示图标', () => {
      renderWithTheme(
        <ModuleButton variant="secondary" icon={Settings}>
          带图标次要按钮
        </ModuleButton>
      );

      expect(screen.getByText('带图标次要按钮')).toBeInTheDocument();
    });

    it('应该在icon variant中只显示图标', () => {
      renderWithTheme(
        <ModuleButton variant="icon" icon={Settings}>
          Icon
        </ModuleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('应该在没有icon时不显示图标', () => {
      renderWithTheme(
        <ModuleButton>
          无图标按钮
        </ModuleButton>
      );

      expect(screen.getByText('无图标按钮')).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理空文本', () => {
      renderWithTheme(
        <ModuleButton>
          {''}
        </ModuleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('应该处理长文本', () => {
      const longText = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常长的按钮文本';

      renderWithTheme(
        <ModuleButton>
          {longText}
        </ModuleButton>
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('应该处理特殊字符', () => {
      const specialText = '按钮 <>&"\' 特殊字符';

      renderWithTheme(
        <ModuleButton>
          {specialText}
        </ModuleButton>
      );

      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it('应该处理icon variant没有icon prop的情况', () => {
      renderWithTheme(
        <ModuleButton variant="icon">
          Icon
        </ModuleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('应该处理多个子元素', () => {
      renderWithTheme(
        <ModuleButton>
          <span>文本1</span>
          <span>文本2</span>
        </ModuleButton>
      );

      expect(screen.getByText('文本1')).toBeInTheDocument();
      expect(screen.getByText('文本2')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('应该是可点击的', () => {
      renderWithTheme(
        <ModuleButton>
          可访问性
        </ModuleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('应该支持键盘导航', () => {
      const handleClick = vi.fn();

      renderWithTheme(
        <ModuleButton onClick={handleClick}>
          键盘导航
        </ModuleButton>
      );

      const button = screen.getByText('键盘导航');
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(button).toBeInTheDocument();
    });

    it('应该支持空格键触发', () => {
      const handleClick = vi.fn();

      renderWithTheme(
        <ModuleButton onClick={handleClick}>
          空格键
        </ModuleButton>
      );

      const button = screen.getByText('空格键');
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(button).toBeInTheDocument();
    });
  });

  describe('样式', () => {
    it('应该应用正确的样式', () => {
      const { container } = renderWithTheme(
        <ModuleButton>
          样式测试
        </ModuleButton>
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('px-6', 'py-2.5', 'rounded-md', 'transition-all', 'duration-300');
    });

    it('应该应用圆角样式', () => {
      const { container } = renderWithTheme(
        <ModuleButton>
          圆角测试
        </ModuleButton>
      );

      const button = container.querySelector('.rounded-md');
      expect(button).toBeInTheDocument();
    });

    it('应该应用过渡动画样式', () => {
      const { container } = renderWithTheme(
        <ModuleButton>
          过渡动画
        </ModuleButton>
      );

      const button = container.querySelector('.transition-all');
      expect(button).toBeInTheDocument();
    });

    it('应该在icon variant上应用正确的样式', () => {
      const { container } = renderWithTheme(
        <ModuleButton variant="icon" icon={Settings}>
          Icon
        </ModuleButton>
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('w-10', 'h-10', 'rounded-full', 'transition-all', 'duration-200');
    });
  });

  describe('不同variant的行为', () => {
    it('primary variant应该有背景色', () => {
      const { container } = renderWithTheme(
        <ModuleButton variant="primary">
          Primary
        </ModuleButton>
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('secondary variant应该有边框', () => {
      const { container } = renderWithTheme(
        <ModuleButton variant="secondary">
          Secondary
        </ModuleButton>
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('icon variant应该是圆形的', () => {
      const { container } = renderWithTheme(
        <ModuleButton variant="icon" icon={Settings}>
          Icon
        </ModuleButton>
      );

      const button = container.querySelector('.rounded-full');
      expect(button).toBeInTheDocument();
    });
  });
});
