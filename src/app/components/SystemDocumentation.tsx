import React from 'react';
import { ModuleCard } from './ModuleCard';

export const SystemDocumentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg bg-white border-l-4" style={{ borderColor: 'var(--module-primary)' }}>
        <h2 className="mb-4" style={{ color: 'var(--module-primary)' }}>
          企业管理知识库UI系统 - 组件库文档
        </h2>
        <p className="mb-4 opacity-70" style={{ color: 'var(--module-dark)' }}>
          本系统基于五高标准（高一致性、高可识别性、高响应性、高可用性、高复用性）设计，
          提供完整的模块化组件库，支持5种主题色彩一键切换。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard title="色彩系统" level={1}>
          <ul className="space-y-2 opacity-80">
            <li>• CPU模块：蓝色 #2A6EBB</li>
            <li>• 内存模块：绿色 #27AE60</li>
            <li>• 存储模块：紫色 #8E44AD</li>
            <li>• 网络模块：橙色 #E67E22</li>
            <li>• 安全模块：红色 #E74C3C</li>
          </ul>
        </ModuleCard>

        <ModuleCard title="边线阴影规范" level={1}>
          <ul className="space-y-2 opacity-80">
            <li>• 菜单导航：3px 阴影</li>
            <li>• 卡片组件：4px 阴影</li>
            <li>• 激活状态：5px 阴影</li>
            <li>• 色值使用模块阴影色</li>
          </ul>
        </ModuleCard>

        <ModuleCard title="交互状态" level={1}>
          <ul className="space-y-2 opacity-80">
            <li>• 静态：默认阴影显示</li>
            <li>• 悬停：Y轴位移+图标旋转15°</li>
            <li>• 选中：缩放1.02+旋转30°</li>
            <li>• 激活：阴影宽度增加</li>
          </ul>
        </ModuleCard>

        <ModuleCard title="动效规范" level={2}>
          <ul className="space-y-2 opacity-80">
            <li>• 位移范围：≤3px</li>
            <li>• 旋转角度：≤30°</li>
            <li>• 时长：200-400ms</li>
            <li>• 缓动：ease-out / ease-in-out</li>
          </ul>
        </ModuleCard>

        <ModuleCard title="响应式断点" level={2}>
          <ul className="space-y-2 opacity-80">
            <li>• 桌面端：&gt;1024px</li>
            <li>• 平板端：768-1024px</li>
            <li>• 移动端：&lt;768px</li>
            <li>• 自适应导航栏收缩</li>
          </ul>
        </ModuleCard>

        <ModuleCard title="无障碍设计" level={2}>
          <ul className="space-y-2 opacity-80">
            <li>• 拒绝纯黑色 #000000</li>
            <li>• 对比度≥4.5:1</li>
            <li>• 主题色焦点环</li>
            <li>• 键盘导航支持</li>
          </ul>
        </ModuleCard>
      </div>

      <div className="p-6 rounded-lg bg-white border-l-4" style={{ borderColor: 'var(--module-shadow)' }}>
        <h3 className="mb-3" style={{ color: 'var(--module-primary)' }}>
          可用组件清单
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70" style={{ color: 'var(--module-dark)' }}>
          <div>
            <h4 className="mb-2 font-medium">导航与布局</h4>
            <ul className="space-y-1 ml-4">
              <li>→ Navigation 导航栏</li>
              <li>→ ModuleBreadcrumb 面包屑</li>
              <li>→ ModuleTabs 标签页</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium">输入与交互</h4>
            <ul className="space-y-1 ml-4">
              <li>→ ModuleSearchBox 搜索框</li>
              <li>→ ModuleCheckbox 复选框</li>
              <li>→ ModuleButton 按钮组</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium">数据展示</h4>
            <ul className="space-y-1 ml-4">
              <li>→ ModuleCard 卡片组件</li>
              <li>→ ModuleTable 数据表格</li>
              <li>→ DataDashboard 数据看板</li>
              <li>→ ModuleProgress 进度条</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium">辅助组件</h4>
            <ul className="space-y-1 ml-4">
              <li>→ ModuleBadge 徽章标签</li>
              <li>→ ThemeProvider 主题上下文</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-white border-l-4" style={{ borderColor: 'var(--module-primary)' }}>
        <h3 className="mb-3" style={{ color: 'var(--module-primary)' }}>
          使用示例
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium opacity-80" style={{ color: 'var(--module-dark)' }}>
              主题切换
            </h4>
            <pre className="p-4 rounded bg-gray-100 overflow-x-auto">
              <code style={{ color: 'var(--module-dark)' }}>
{`// 在组件中使用主题
import { useTheme } from './contexts/ThemeContext';

const { currentTheme, setTheme } = useTheme();
setTheme('memory'); // 切换到内存模块主题`}
              </code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-medium opacity-80" style={{ color: 'var(--module-dark)' }}>
              组件使用
            </h4>
            <pre className="p-4 rounded bg-gray-100 overflow-x-auto">
              <code style={{ color: 'var(--module-dark)' }}>
{`// 导入组件
import { ModuleCard } from './components/ModuleCard';

// 使用组件
<ModuleCard title="标题" level={1}>
  内容区域
</ModuleCard>`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
