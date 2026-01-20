/**
 * @file LayoutDemo组件 - Layout和EmailList组件演示
 * @description 展示优化后的企业级布局系统和邮件列表
 * @module components/demo
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { Layout } from './Layout';
import { EmailList } from './EmailList';

/**
 * Layout演示组件
 * 用于展示完整的布局系统和邮件列表功能
 */
export const LayoutDemo: React.FC = () => {
  // 设置模拟用户数据
  useEffect(() => {
    const mockUser = {
      id: '1',
      email: 'zhang.hua@company.com',
      fullName: '张华',
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
  }, []);

  return (
    <div className="theme-cpu">
      <Layout>
        {/* 页面标题 */}
        <div 
          className="mb-6 p-6 bg-white rounded-lg"
          style={{
            borderTop: '1px solid rgba(42, 110, 187, 0.2)',
            borderLeft: '4px solid var(--module-cpu-primary)',
            borderRight: '2px solid var(--module-cpu-shadow)',
            borderBottom: '2px solid var(--module-cpu-shadow)',
            boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
          }}
        >
          <h1 style={{ color: 'var(--module-cpu-dark)' }}>企业邮箱管理系统</h1>
          <p 
            className="mt-2"
            style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}
          >
            您有 24 封未读邮件 • 6 封智能回复建议 • 系统运行正常
          </p>
        </div>

        {/* 邮件列表 */}
        <EmailList />

        {/* 设计说明 */}
        <div 
          className="mt-6 p-6 bg-white rounded-lg"
          style={{
            borderTop: '1px solid rgba(42, 110, 187, 0.2)',
            borderLeft: '4px solid var(--module-cpu-primary)',
            borderRight: '2px solid var(--module-cpu-shadow)',
            borderBottom: '2px solid var(--module-cpu-shadow)',
            boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
          }}
        >
          <h2 style={{ color: 'var(--module-cpu-primary)' }}>设计规范说明</h2>
          <div className="mt-4 space-y-3">
            <Section title="🎨 完整四边边框系统（3D视觉）">
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--module-cpu-dark)' }}>
                <li><strong>顶部边框：</strong>1px 浅色（rgba opacity 0.15-0.2）高光效果</li>
                <li><strong>左侧边框：</strong>3-5px 主题色/阴影色，视觉焦点和层级标识</li>
                <li><strong>右侧边框：</strong>1-2px 阴影色（opacity 0.25-0.4）增强立体感</li>
                <li><strong>底部边框：</strong>1-2px 深色（opacity 0.15-0.3）模拟阴影投射</li>
                <li><strong>BoxShadow：</strong>配合边框的外部阴影，营造浮空效果</li>
              </ul>
            </Section>

            <Section title="📏 边线阴影系统（3px/4px/5px层次）">
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--module-cpu-dark)' }}>
                <li>静态状态：3px 边框宽度</li>
                <li>悬浮状态：4px 边框宽度 + 轻微位移（-1px ~ -2px）</li>
                <li>激活状态：5px 边框宽度 + 明显位移（1px ~ 2px）</li>
                <li>选中状态：保持 3px + 背景色变化 + 阴影效果</li>
              </ul>
            </Section>

            <Section title="🎭 四态交互系统">
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--module-cpu-dark)' }}>
                <li><strong>静态：</strong>默认状态，3px边框，无阴影</li>
                <li><strong>悬浮：</strong>4px边框，浅色背景，轻微上浮</li>
                <li><strong>选中：</strong>主题色背景，边框增强，阴影显现</li>
                <li><strong>激活：</strong>5px边框，下压动效，深色阴影</li>
              </ul>
            </Section>

            <Section title="🎨 主题色彩映射链（CPU蓝色）">
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--module-cpu-dark)' }}>
                <li><strong>主题色（#2A6EBB）：</strong>主要交互元素、图标、按钮</li>
                <li><strong>阴影色（#1E5CA3）：</strong>边框阴影、次要元素</li>
                <li><strong>深色文本（#0D3A6A）：</strong>标题、重要文本</li>
                <li><strong>浅背景（#F0F7FF）：</strong>卡片背景、悬浮高亮</li>
              </ul>
            </Section>

            <Section title="⚡ 动效限制规范">
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--module-cpu-dark)' }}>
                <li>位移：≤3px（符合悬浮-1~-2px、激活1~2px标准）</li>
                <li>旋转：≤30°（图标悬浮15°、按钮交互5-15°）</li>
                <li>时长：200-400ms（快速响应，不延迟交互）</li>
                <li>缓动：easeOut / easeInOut（自然流畅）</li>
              </ul>
            </Section>

            <Section title="📱 响应式适配">
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--module-cpu-dark)' }}>
                <li>桌面：侧边栏固定展开，完整功能显示</li>
                <li>平板：侧边栏可折叠，保持核心功能</li>
                <li>移动：侧边栏抽屉式，遮罩层交互</li>
                <li>断点：768px（lg）作为主要响应式分界点</li>
              </ul>
            </Section>
          </div>
        </div>
      </Layout>
    </div>
  );
};

/**
 * 章节组件
 */
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div 
    className="p-4 rounded-md"
    style={{
      backgroundColor: 'rgba(42, 110, 187, 0.03)',
      borderLeft: '3px solid var(--module-cpu-primary)',
    }}
  >
    <h3 
      className="mb-2"
      style={{ color: 'var(--module-cpu-primary)' }}
    >
      {title}
    </h3>
    {children}
  </div>
);

export default LayoutDemo;