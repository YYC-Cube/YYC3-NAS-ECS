# YYC³（YanYuCloudCube）企业邮箱系统 - 独立使用指南

## 📧 系统概述

这是一个遵循"五高标准"和"五标规范"的企业级邮箱管理系统，具备完整的3D边框视觉系统、四态交互、主题切换等企业级功能。

## 🎯 核心特性

### 五高标准

- ✅ **高一致性**：统一的色彩映射链和交互模式
- ✅ **高可识别性**：清晰的层级和状态视觉反馈
- ✅ **高响应性**：流畅的动画和交互体验
- ✅ **高可用性**：完善的无障碍支持
- ✅ **高复用性**：模块化组件设计

### 五标规范

- 🎨 **色彩标准**：5个主题模块（CPU蓝、内存绿、存储紫、网络橙、安全红）
- 🖱️ **交互标准**：四态交互（静态、悬停、选中、激活）
- ⚡ **动效标准**：位移≤3px、旋转≤30°、时长200-400ms
- 📐 **层级标准**：3px/4px/5px边线阴影系统
- 🔄 **状态标准**：完整的视觉状态反馈

## 📦 文件结构

```
src/
├── app/
│   ├── EmailApp.tsx              # 独立邮箱应用主入口（新）
│   ├── components/
│   │   └── EmailList.tsx         # 邮件列表组件
│   └── contexts/
│       └── ThemeContext.tsx      # 主题上下文
├── styles/
│   ├── index.css                 # 全局样式入口
│   ├── tailwind.css              # Tailwind配置
│   ├── theme.css                 # 主题CSS变量系统
│   └── fonts.css                 # 字体导入
```

## 🚀 快速开始

### 方法1：修改App.tsx入口文件（推荐）

替换 `/src/App.tsx` 的内容为：

```tsx
import { EmailApp } from './app/EmailApp';

export default EmailApp;
```

### 方法2：在现有应用中集成

```tsx
import { EmailApp } from './app/EmailApp';

function MyApp() {
  return (
    <div>
      <EmailApp />
    </div>
  );
}

export default MyApp;
```

### 方法3：作为独立路由页面

如果你使用React Router：

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EmailApp } from './app/EmailApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/email" element={<EmailApp />} />
        {/* 其他路由 */}
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎨 主题系统

邮箱系统支持5个主题模块的一键切换：

```tsx
// 主题已内置在EmailApp中，无需额外配置
// 用户可通过左侧边栏底部的主题切换器进行切换

主题模块：
- CPU（蓝色）  - #2A6EBB
- 内存（绿色） - #27AE60
- 存储（紫色） - #8E44AD
- 网络（橙色） - #E67E22
- 安全（红色） - #E74C3C
```

## 🧩 核心组件说明

### 1. EmailApp（主应用）

- 完整的邮箱界面布局
- 顶部导航栏（Logo、搜索框、用户操作）
- 左侧菜单栏（邮件分类、AI助手、主题切换）
- 主内容区（邮件列表显示）

### 2. EmailList（邮件列表）

- 邮件列表展示
- 四态交互（静态、悬浮、选中、激活）
- 批量操作工具栏
- 邮件星标、已读/未读状态管理

### 3. ThemeContext（主题管理）

- 全局主题状态管理
- 主题切换功能
- CSS变量动态更新

## 🎯 功能模块

### 已实现功能

- ✅ 收件箱（邮件列表展示）
- ✅ AI智能助手板块
- ✅ 主题一键切换（5个模块主题）
- ✅ 邮件搜索框
- ✅ 邮件批量操作（全选、删除、标记）
- ✅ 星标邮件管理
- ✅ 响应式设计

### 待开发功能

- ⏳ 已发送邮件列表
- ⏳ 草稿箱管理
- ⏳ 邮件归档功能
- ⏳ 回收站功能
- ⏳ 撰写邮件编辑器
- ⏳ AI智能回复功能

## 📝 邮件数据结构

```typescript
interface EmailItem {
  id: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
    department?: string;
  };
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  attachments?: number;
  priority?: 'high' | 'normal' | 'low';
  hasAIReply?: boolean;
  category?: string;
}
```

## 🎨 视觉规范

### 3D边框系统

```css
/* 主容器边框 */
borderTop: '1px solid rgba(42, 110, 187, 0.2)'
borderLeft: '4px solid var(--module-cpu-primary)'
borderRight: '2px solid var(--module-cpu-shadow)'
borderBottom: '2px solid var(--module-cpu-shadow)'
boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)'
```

### 四态交互

- **静态（Static）**：默认状态，基础视觉
- **悬浮（Hover）**：鼠标悬停，轻微变换（位移≤3px）
- **选中（Selected）**：已选中状态，高亮显示
- **激活（Active）**：点击/按下状态，缩放效果

### 动效参数

- 位移动画：≤3px
- 旋转动画：≤30°
- 动画时长：200-400ms
- 缓动函数：ease-in-out

## 🔧 自定义配置

### 修改主题颜色

编辑 `/src/styles/theme.css` 中的CSS变量：

```css
:root {
  /* 修改CPU主题颜色示例 */
  --module-cpu-primary: #2A6EBB;  /* 主色 */
  --module-cpu-shadow: #1E5CA3;   /* 阴影色 */
  --module-cpu-dark: #0D3A6A;     /* 深色文本 */
  --module-cpu-light: #F0F7FF;    /* 浅背景 */
}
```

### 修改邮件数据

编辑 `/src/app/components/EmailList.tsx` 中的 `mockEmails` 数据：

```tsx
const mockEmails: EmailItem[] = [
  {
    id: '1',
    sender: { name: '张三', email: 'zhang.san@company.com' },
    subject: '会议通知',
    preview: '明天下午2点开会...',
    // ... 其他字段
  },
  // 添加更多邮件
];
```

## 📱 响应式支持

系统已实现响应式设计，支持以下屏幕尺寸：

- 📱 移动端：< 768px
- 💻 平板：768px - 1024px
- 🖥️ 桌面：> 1024px

## 🔌 依赖项

系统依赖以下核心包（已在package.json中配置）：

```json
{
  "motion": "^12.23.24",           // 动画库
  "lucide-react": "^0.487.0",      // 图标库
  "react": "^18.3.1",              // React核心
  "react-dom": "^18.3.1"           // React DOM
}
```

## 🎓 最佳实践

1. **主题切换**：使用内置的主题切换器，避免直接修改CSS变量
2. **动画性能**：使用Motion组件的transform属性，避免使用top/left
3. **无障碍**：为所有交互元素添加aria-label属性
4. **响应式**：优先使用flex和grid布局
5. **状态管理**：使用React Hooks管理组件状态

## 🐛 故障排除

### 主题切换不生效

- 检查`ThemeProvider`是否正确包裹应用
- 确认CSS变量已正确加载

### 动画卡顿

- 检查Motion动画是否使用了transform属性
- 避免同时运行过多动画

### 邮件列表不显示

- 检查`mockEmails`数据是否正确
- 查看浏览器控制台是否有错误

## 📞 技术支持

如需技术支持或有任何问题，请查看：

- 项目文档：`/guidelines/Guidelines.md`
- 组件示例：`/src/app/components/ComponentShowcase.tsx`

## 📄 许可证

本系统遵循企业内部使用许可，详见项目根目录的LICENSE文件。

---

**版本**：2.0.0  
**最后更新**：2024年12月  
**设计规范**：五高标准 + 五标规范  
**技术栈**：React + TypeScript + Motion + Tailwind CSS
