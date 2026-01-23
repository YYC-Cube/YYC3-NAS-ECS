import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navigation } from './components/Navigation';
import { ModuleBreadcrumb } from './components/ModuleBreadcrumb';
import { ModuleSearchBox } from './components/ModuleSearchBox';
import { ModuleCard } from './components/ModuleCard';
import { ModuleButton } from './components/ModuleButton';
import { ModuleCheckbox } from './components/ModuleCheckbox';
import { ModuleProgress } from './components/ModuleProgress';
import { DataDashboard } from './components/DataDashboard';
import { ModuleTable } from './components/ModuleTable';
import { ModuleTabs } from './components/ModuleTabs';
import { ModuleBadge } from './components/ModuleBadge';
import { LayoutDemo } from './components/LayoutDemo';
import { AIWidgetProvider } from './components/ai-floating-widget';
import { Plus, Download, Settings, RefreshCw, Mail } from 'lucide-react';

type ModuleTheme = 'cpu' | 'memory' | 'storage' | 'network' | 'security';
type ViewMode = 'components' | 'layout';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<ModuleTheme>('cpu');
  const [viewMode, setViewMode] = useState<ViewMode>('components');

  // 初始化默认主题
  React.useEffect(() => {
    document.documentElement.classList.add('theme-cpu');
  }, []);

  const handleThemeChange = (theme: ModuleTheme) => {
    setCurrentTheme(theme);
    // 更新根元素主题类
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.documentElement.classList.add(`theme-${theme}`);
  };

  // 主题对应的中文名称
  const themeNames: Record<ModuleTheme, string> = {
    cpu: 'CPU管理',
    memory: '内存监控',
    storage: '存储系统',
    network: '网络配置',
    security: '安全中心',
  };

  // 数据看板示例数据
  const dashboardMetrics = [
    { label: '总使用率', value: '67.8', unit: '%', trend: 'up' as const, trendValue: '+5.2%' },
    { label: '活动进程', value: '156', unit: '个', trend: 'stable' as const, trendValue: '±0' },
    { label: '响应时间', value: '12', unit: 'ms', trend: 'down' as const, trendValue: '-3ms' },
    { label: '内存占用', value: '8.4', unit: 'GB', trend: 'up' as const, trendValue: '+0.6GB' },
    { label: '网络带宽', value: '245', unit: 'Mbps', trend: 'up' as const, trendValue: '+12%' },
    { label: '错误率', value: '0.03', unit: '%', trend: 'down' as const, trendValue: '-0.01%' },
  ];

  // 如果是Layout视图模式，直接返回LayoutDemo
  if (viewMode === 'layout') {
    return <LayoutDemo />;
  }

  return (
    <ThemeProvider>
      <AIWidgetProvider autoInit={false} enableShortcut={true} shortcut="Ctrl+K">
        <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <Navigation onThemeChange={handleThemeChange} />

        {/* 主内容区域 */}
        <div className="ml-20 md:ml-64 p-4 md:p-8 transition-all duration-300">
          {/* 顶部区域 */}
          <div className="mb-8 space-y-4">
            {/* 面包屑导航 */}
            <ModuleBreadcrumb 
              items={[
                { label: '知识库管理' },
                { label: themeNames[currentTheme] },
                { label: '系统概览' },
              ]}
            />

            {/* 搜索框 */}
            <ModuleSearchBox 
              placeholder={`搜索${themeNames[currentTheme]}相关内容...`}
            />
          </div>

          {/* 主题切换提示 + 视图切换按钮 */}
          <div className="mb-8 p-4 rounded-lg bg-white border-l-4" 
            style={{ borderColor: 'var(--module-primary)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="mb-2" style={{ color: 'var(--module-primary)' }}>
                  当前模块：{themeNames[currentTheme]}
                </h2>
                <p className="opacity-70" style={{ color: 'var(--module-dark)' }}>
                  点击左侧导航栏切换不同模块主题，体验完整的色彩映射系统和交互状态。
                </p>
              </div>
              <ModuleButton 
                icon={Mail} 
                onClick={() => setViewMode('layout')}
              >
                查看邮件布局演示
              </ModuleButton>
            </div>
          </div>

          {/* 数据看板 */}
          <div className="mb-8">
            <DataDashboard 
              title="系统性能监控"
              metrics={dashboardMetrics}
            />
          </div>

          {/* 按钮组件展示 */}
          <div className="mb-8">
            <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
              按钮组件
            </h3>
            <div className="flex flex-wrap gap-4">
              <ModuleButton icon={Plus}>
                新建任务
              </ModuleButton>
              <ModuleButton variant="secondary" icon={Download}>
                导出数据
              </ModuleButton>
              <ModuleButton variant="icon" icon={Settings} />
              <ModuleButton variant="icon" icon={RefreshCw} />
            </div>
          </div>

          {/* 卡片组件展示 */}
          <div className="mb-8">
            <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
              卡片组件
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModuleCard title="内容卡片 - 层级1" level={1}>
                <p className="mb-3">
                  这是一个标准内容卡片，使用4px左侧阴影和浅背景。
                </p>
                <p className="opacity-70">
                  悬停时会有Y轴位移和3D阴影效果。
                </p>
              </ModuleCard>

              <ModuleCard title="数据卡片 - 层级2" level={2}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>总容量</span>
                    <span className="font-medium">512 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已使用</span>
                    <span className="font-medium">346 GB</span>
                  </div>
                </div>
              </ModuleCard>

              <ModuleCard title="交互卡片" level={1}>
                <p className="mb-3">
                  点击卡片可以看到阴影宽度从4px增至5px。
                </p>
                <ModuleButton variant="secondary">
                  查看详情
                </ModuleButton>
              </ModuleCard>
            </div>
          </div>

          {/* 进度条组件展示 */}
          <div className="mb-8 bg-white p-6 rounded-lg">
            <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
              进度指示器
            </h3>
            <div className="space-y-4">
              <ModuleProgress label="CPU使用率" value={45} />
              <ModuleProgress label="内存使用率" value={72} />
              <ModuleProgress label="磁盘使用率" value={88} />
              <ModuleProgress label="网络带宽" value={34} />
            </div>
            <p className="mt-4 text-sm opacity-70" style={{ color: 'var(--module-dark)' }}>
              注意：超过80%的进度条会显示深色渐变并带有脉动动画效果。
            </p>
          </div>

          {/* 复选框和徽章组件 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
                复选框控件
              </h3>
              <div className="space-y-3">
                <ModuleCheckbox label="启用自动备份" />
                <ModuleCheckbox label="开启性能监控" />
                <ModuleCheckbox label="发送告警通知" />
                <ModuleCheckbox label="记录操作日志" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
                徽章组件
              </h3>
              <div className="flex flex-wrap gap-3">
                <ModuleBadge variant="primary">活跃</ModuleBadge>
                <ModuleBadge variant="secondary">待处理</ModuleBadge>
                <ModuleBadge variant="outline">已完成</ModuleBadge>
                <ModuleBadge variant="primary">新功能</ModuleBadge>
                <ModuleBadge variant="outline">V2.0</ModuleBadge>
              </div>
            </div>
          </div>

          {/* 表格组件展示 */}
          <div className="mb-8 bg-white p-6 rounded-lg">
            <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
              数据表格
            </h3>
            <ModuleTable
              columns={[
                { key: 'name', label: '服务名称' },
                { key: 'status', label: '状态' },
                { key: 'cpu', label: 'CPU使用率' },
                { key: 'memory', label: '内存使用' },
                { key: 'uptime', label: '运行时间' },
              ]}
              data={[
                { name: 'Web服务器', status: '运行中', cpu: '23%', memory: '2.1 GB', uptime: '7天' },
                { name: '数据库服务', status: '运行中', cpu: '45%', memory: '4.8 GB', uptime: '7天' },
                { name: '缓存服务', status: '运行中', cpu: '12%', memory: '1.2 GB', uptime: '7天' },
                { name: '消息队列', status: '运行中', cpu: '8%', memory: '0.8 GB', uptime: '7天' },
                { name: '监控服务', status: '运行中', cpu: '15%', memory: '1.5 GB', uptime: '7天' },
              ]}
            />
          </div>

          {/* 标签页组件展示 */}
          <div className="mb-8 bg-white p-6 rounded-lg">
            <h3 className="mb-4" style={{ color: 'var(--module-dark)' }}>
              标签页组件
            </h3>
            <ModuleTabs
              tabs={[
                {
                  id: 'overview',
                  label: '概览',
                  content: (
                    <div className="space-y-4">
                      <p style={{ color: 'var(--module-dark)' }}>
                        系统运行正常，所有核心服务运行稳定。当前共有156个活跃进程，CPU平均使用率67.8%。
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded border-l-3" style={{ borderColor: 'var(--module-shadow)' }}>
                          <div className="opacity-60" style={{ color: 'var(--module-primary)' }}>总请求数</div>
                          <div className="mt-2" style={{ color: 'var(--module-primary)' }}>1,234,567</div>
                        </div>
                        <div className="p-4 rounded border-l-3" style={{ borderColor: 'var(--module-shadow)' }}>
                          <div className="opacity-60" style={{ color: 'var(--module-primary)' }}>成功率</div>
                          <div className="mt-2" style={{ color: 'var(--module-primary)' }}>99.97%</div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'performance',
                  label: '性能',
                  content: (
                    <div className="space-y-4">
                      <ModuleProgress label="CPU核心1" value={56} />
                      <ModuleProgress label="CPU核心2" value={43} />
                      <ModuleProgress label="CPU核心3" value={67} />
                      <ModuleProgress label="CPU核心4" value={89} />
                    </div>
                  ),
                },
                {
                  id: 'logs',
                  label: '日志',
                  content: (
                    <div className="space-y-2">
                      {[
                        '2024-12-14 10:23:45 - 系统启动成功',
                        '2024-12-14 10:24:12 - 数据库连接建立',
                        '2024-12-14 10:25:03 - 缓存服务就绪',
                        '2024-12-14 10:26:34 - API服务启动完成',
                      ].map((log, i) => (
                        <div
                          key={i}
                          className="p-2 rounded"
                          style={{
                            backgroundColor: 'rgba(var(--module-light-rgb), 0.2)',
                            color: 'var(--module-dark)',
                          }}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* 设计特性总结 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-lg bg-white border-l-4"
              style={{ borderColor: 'var(--module-primary)' }}
            >
              <h4 className="mb-3" style={{ color: 'var(--module-primary)' }}>
                五高标准
              </h4>
              <ul className="space-y-2 opacity-70" style={{ color: 'var(--module-dark)' }}>
                <li>✓ 高一致性：统一的色彩映射规则</li>
                <li>✓ 高可识别性：边线阴影视觉识别</li>
                <li>✓ 高响应性：四态交互反馈</li>
                <li>✓ 高可用性：拒绝纯黑色设计</li>
                <li>✓ 高复用性：组件标准化</li>
              </ul>
            </div>

            <div className="p-6 rounded-lg bg-white border-l-4"
              style={{ borderColor: 'var(--module-shadow)' }}
            >
              <h4 className="mb-3" style={{ color: 'var(--module-primary)' }}>
                交互状态
              </h4>
              <ul className="space-y-2 opacity-70" style={{ color: 'var(--module-dark)' }}>
                <li>→ 静态态：标准3px/4px阴影</li>
                <li>→ 悬停态：位移+图标旋转15°</li>
                <li>→ 选中态：缩放1.02+图标旋转30°</li>
                <li>→ 激活态：阴影增至5px</li>
                <li>→ 滚动态：透明度降至80%</li>
              </ul>
            </div>

            <div className="p-6 rounded-lg bg-white border-l-4"
              style={{ borderColor: 'var(--module-primary)' }}
            >
              <h4 className="mb-3" style={{ color: 'var(--module-primary)' }}>
                响应式适配
              </h4>
              <ul className="space-y-2 opacity-70" style={{ color: 'var(--module-dark)' }}>
                <li>• 桌面端：完整组件显示</li>
                <li>• 平板端：阴影宽度-1px</li>
                <li>• 移动端：导航栏图标模式</li>
                <li>• 自适应布局切换</li>
              </ul>
            </div>
          </div>
        </div>
      </AIWidgetProvider>
    </ThemeProvider>
  );
}