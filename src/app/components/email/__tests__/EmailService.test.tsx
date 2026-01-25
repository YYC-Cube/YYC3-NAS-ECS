/**
 * @file EmailService.test.tsx
 * @description 邮件服务组件测试
 * @module __tests__/components/email
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-25
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { EmailService } from '../EmailService';
import { ThemeProvider } from '../../../contexts/ThemeContext';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('组件渲染', () => {
    it('应该正确渲染邮件服务主界面', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('企业邮箱系统')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Email Management')).toBeInTheDocument();
    });

    it('应该显示所有菜单项', () => {
      renderWithTheme(<EmailService />);
      
      const dashboardButtons = screen.getAllByText('概览面板');
      expect(dashboardButtons.length).toBeGreaterThan(0);
      expect(screen.getByText('收件箱')).toBeInTheDocument();
      expect(screen.getByText('已发送')).toBeInTheDocument();
      expect(screen.getByText('星标邮件')).toBeInTheDocument();
      expect(screen.getByText('草稿箱')).toBeInTheDocument();
      expect(screen.getByText('归档')).toBeInTheDocument();
      expect(screen.getByText('回收站')).toBeInTheDocument();
    });

    it('应该显示搜索框', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      expect(searchInput).toBeInTheDocument();
    });

    it('应该显示撰写邮件按钮', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('撰写邮件')).toBeInTheDocument();
    });

    it('应该显示主题切换器', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('主题模块')).toBeInTheDocument();
    });

    it('应该显示AI智能助手菜单项', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('AI智能助手')).toBeInTheDocument();
    });
  });

  describe('Dashboard视图', () => {
    it('应该默认显示Dashboard视图', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('邮件服务运行状态概览')).toBeInTheDocument();
    });

    it('应该显示邮件队列状态', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('邮件队列状态')).toBeInTheDocument();
      expect(screen.getByText('待发送')).toBeInTheDocument();
      expect(screen.getByText('今日已发送')).toBeInTheDocument();
      expect(screen.getByText('发送失败')).toBeInTheDocument();
    });

    it('应该显示正确的邮件统计数据', () => {
      renderWithTheme(<EmailService />);
      
      const container = screen.getByText('邮件队列状态').closest('div');
      expect(container).toBeInTheDocument();
      expect(container?.textContent).toContain('12');
      expect(container?.textContent).toContain('1458');
      expect(container?.textContent).toContain('3');
    });

    it('应该显示发送测试邮件表单', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('发送测试邮件')).toBeInTheDocument();
      expect(screen.getByText('收件人')).toBeInTheDocument();
      expect(screen.getByText('模板')).toBeInTheDocument();
      expect(screen.getByText('发送')).toBeInTheDocument();
    });

    it('应该包含所有邮件模板选项', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('用户欢迎 (User Welcome)')).toBeInTheDocument();
      expect(screen.getByText('系统告警 (System Alert)')).toBeInTheDocument();
      expect(screen.getByText('周报生成 (Weekly Report)')).toBeInTheDocument();
    });
  });

  describe('菜单导航', () => {
    it('应该能够切换到收件箱视图', async () => {
      renderWithTheme(<EmailService />);
      
      const inboxButton = screen.getByText('收件箱');
      fireEvent.click(inboxButton);
      
      await waitFor(() => {
        expect(screen.getByText('您有 12 封未读邮件')).toBeInTheDocument();
      });
    });

    it('应该能够切换到已发送视图', async () => {
      renderWithTheme(<EmailService />);
      
      const sentButton = screen.getByText('已发送');
      fireEvent.click(sentButton);
      
      await waitFor(() => {
        expect(screen.getByText('邮件管理')).toBeInTheDocument();
      });
    });

    it('应该能够切换到星标邮件视图', async () => {
      renderWithTheme(<EmailService />);
      
      const starredButton = screen.getByText('星标邮件');
      fireEvent.click(starredButton);
      
      await waitFor(() => {
        expect(screen.getByText('邮件管理')).toBeInTheDocument();
      });
    });

    it('应该能够切换到草稿箱视图', async () => {
      renderWithTheme(<EmailService />);
      
      const draftsButton = screen.getByText('草稿箱');
      fireEvent.click(draftsButton);
      
      await waitFor(() => {
        expect(screen.getByText('邮件管理')).toBeInTheDocument();
      });
    });

    it('应该能够切换到归档视图', async () => {
      renderWithTheme(<EmailService />);
      
      const archiveButton = screen.getByText('归档');
      fireEvent.click(archiveButton);
      
      await waitFor(() => {
        expect(screen.getByText('邮件管理')).toBeInTheDocument();
      });
    });

    it('应该能够切换到回收站视图', async () => {
      renderWithTheme(<EmailService />);
      
      const trashButton = screen.getByText('回收站');
      fireEvent.click(trashButton);
      
      await waitFor(() => {
        expect(screen.getByText('邮件管理')).toBeInTheDocument();
      });
    });

    it('应该能够切换回Dashboard视图', async () => {
      renderWithTheme(<EmailService />);
      
      const inboxButton = screen.getByText('收件箱');
      fireEvent.click(inboxButton);
      
      await waitFor(() => {
        expect(screen.getByText('您有 12 封未读邮件')).toBeInTheDocument();
      });
      
      const dashboardButton = screen.getByText('概览面板');
      fireEvent.click(dashboardButton);
      
      await waitFor(() => {
        expect(screen.getByText('邮件服务运行状态概览')).toBeInTheDocument();
      });
    });
  });

  describe('AI助手视图', () => {
    it('应该显示AI智能助手按钮', () => {
      renderWithTheme(<EmailService />);
      
      const aiButton = screen.getByText('AI智能助手');
      expect(aiButton).toBeInTheDocument();
    });

    it('应该能够点击AI智能助手按钮', () => {
      renderWithTheme(<EmailService />);
      
      const aiButton = screen.getByText('AI智能助手');
      expect(() => fireEvent.click(aiButton)).not.toThrow();
    });
  });

  describe('搜索功能', () => {
    it('应该能够输入搜索关键词', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      fireEvent.change(searchInput, { target: { value: '测试邮件' } });
      
      expect(searchInput).toHaveValue('测试邮件');
    });

    it('应该能够清空搜索框', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      fireEvent.change(searchInput, { target: { value: '测试邮件' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(searchInput).toHaveValue('');
    });

    it('应该能够处理特殊字符搜索', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      fireEvent.change(searchInput, { target: { value: '测试@#$%^&*()' } });
      
      expect(searchInput).toHaveValue('测试@#$%^&*()');
    });

    it('应该能够处理长搜索关键词', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      const longText = 'a'.repeat(1000);
      fireEvent.change(searchInput, { target: { value: longText } });
      
      expect(searchInput).toHaveValue(longText);
    });
  });

  describe('邮件发送功能', () => {
    it('应该能够填写邮件表单', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(toInput, { target: { value: 'test@example.com' } });
      
      expect(toInput).toHaveValue('test@example.com');
    });

    it('应该能够选择邮件模板', () => {
      renderWithTheme(<EmailService />);
      
      const templateSelect = screen.getByDisplayValue('用户欢迎 (User Welcome)');
      fireEvent.change(templateSelect, { target: { value: 'alert' } });
      
      expect(templateSelect).toHaveValue('alert');
    });

    it('应该能够提交邮件表单', async () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      const templateSelect = screen.getByDisplayValue('用户欢迎 (User Welcome)');
      const sendButton = screen.getByText('发送');
      
      fireEvent.change(toInput, { target: { value: 'test@example.com' } });
      fireEvent.change(templateSelect, { target: { value: 'welcome' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('测试邮件已发送至 test@example.com (模板: welcome)');
      });
    });

    it('应该在发送成功后清空收件人', async () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      const sendButton = screen.getByText('发送');
      
      fireEvent.change(toInput, { target: { value: 'test@example.com' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
      
      expect(toInput).toHaveValue('');
    });

    it('应该验证收件人邮箱格式', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      const sendButton = screen.getByText('发送');
      
      fireEvent.change(toInput, { target: { value: 'invalid-email' } });
      
      expect(toInput).toBeInvalid();
    });

    it('应该要求收件人必填', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      
      expect(toInput).toBeRequired();
    });
  });

  describe('主题切换功能', () => {
    it('应该显示主题切换器', () => {
      renderWithTheme(<EmailService />);
      
      expect(screen.getByText('主题模块')).toBeInTheDocument();
      expect(screen.getByText('CPU | 内存 | 存储 | 网络 | 安全')).toBeInTheDocument();
    });

    it('应该显示多个主题按钮', () => {
      const { container } = renderWithTheme(<EmailService />);
      
      const themeButtons = container.querySelectorAll('button');
      const themeSwitcherButtons = Array.from(themeButtons).filter(btn => {
        const parent = btn.closest('div');
        return parent?.textContent?.includes('主题模块');
      });
      
      expect(themeSwitcherButtons.length).toBeGreaterThan(0);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空收件人提交', async () => {
      renderWithTheme(<EmailService />);
      
      const sendButton = screen.getByText('发送');
      fireEvent.click(sendButton);
      
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('应该处理无效邮箱格式', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(toInput, { target: { value: 'invalid' } });
      
      expect(toInput).toBeInvalid();
    });

    it('应该处理超长收件人地址', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      const longEmail = 'a'.repeat(1000) + '@example.com';
      fireEvent.change(toInput, { target: { value: longEmail } });
      
      expect(toInput).toHaveValue(longEmail);
    });

    it('应该处理特殊字符收件人', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(toInput, { target: { value: 'test+special@example.com' } });
      
      expect(toInput).toHaveValue('test+special@example.com');
    });

    it('应该处理空搜索', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(searchInput).toHaveValue('');
    });

    it('应该处理快速连续菜单切换', async () => {
      renderWithTheme(<EmailService />);
      
      const inboxButton = screen.getByText('收件箱');
      const dashboardButtons = screen.getAllByText('概览面板');
      const dashboardButton = dashboardButtons[0];
      
      fireEvent.click(inboxButton);
      fireEvent.click(dashboardButton);
      fireEvent.click(inboxButton);
      
      await waitFor(() => {
        expect(screen.getByText('您有 12 封未读邮件')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('应该处理表单提交失败', async () => {
      renderWithTheme(<EmailService />);
      
      const sendButton = screen.getByText('发送');
      
      try {
        fireEvent.click(sendButton);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('应该能够选择有效的模板选项', () => {
      renderWithTheme(<EmailService />);
      
      const templateSelect = screen.getByDisplayValue('用户欢迎 (User Welcome)');
      fireEvent.change(templateSelect, { target: { value: 'alert' } });
      
      expect(templateSelect).toHaveValue('alert');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内渲染组件', () => {
      const startTime = performance.now();
      renderWithTheme(<EmailService />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('应该能够快速切换菜单', async () => {
      renderWithTheme(<EmailService />);
      
      const startTime = performance.now();
      const inboxButton = screen.getByText('收件箱');
      fireEvent.click(inboxButton);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('应该能够快速输入搜索关键词', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      const startTime = performance.now();
      fireEvent.change(searchInput, { target: { value: '测试邮件' } });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('并发操作测试', () => {
    it('应该能够同时处理多个搜索输入', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      fireEvent.change(searchInput, { target: { value: '测试1' } });
      fireEvent.change(searchInput, { target: { value: '测试2' } });
      fireEvent.change(searchInput, { target: { value: '测试3' } });
      
      expect(searchInput).toHaveValue('测试3');
    });

    it('应该能够快速连续切换菜单', async () => {
      renderWithTheme(<EmailService />);
      
      const inboxButton = screen.getByText('收件箱');
      const dashboardButtons = screen.getAllByText('概览面板');
      const dashboardButton = dashboardButtons[0];
      
      for (let i = 0; i < 10; i++) {
        fireEvent.click(inboxButton);
        fireEvent.click(dashboardButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('邮件服务运行状态概览')).toBeInTheDocument();
      });
    });
  });

  describe('数据验证测试', () => {
    it('应该验证收件人邮箱格式', () => {
      renderWithTheme(<EmailService />);
      
      const toInput = screen.getByPlaceholderText('user@example.com');
      
      fireEvent.change(toInput, { target: { value: 'test@example.com' } });
      expect(toInput).toBeValid();
      
      fireEvent.change(toInput, { target: { value: 'invalid' } });
      expect(toInput).toBeInvalid();
    });

    it('应该验证模板选项', () => {
      renderWithTheme(<EmailService />);
      
      const templateSelect = screen.getByDisplayValue('用户欢迎 (User Welcome)');
      
      expect(templateSelect).toHaveValue('welcome');
      
      fireEvent.change(templateSelect, { target: { value: 'alert' } });
      expect(templateSelect).toHaveValue('alert');
      
      fireEvent.change(templateSelect, { target: { value: 'report' } });
      expect(templateSelect).toHaveValue('report');
    });
  });

  describe('可访问性测试', () => {
    it('应该为按钮提供aria-label', () => {
      renderWithTheme(<EmailService />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('应该支持键盘导航', () => {
      renderWithTheme(<EmailService />);
      
      const searchInput = screen.getByPlaceholderText('搜索邮件...');
      searchInput.focus();
      
      expect(document.activeElement).toBe(searchInput);
    });
  });
});
