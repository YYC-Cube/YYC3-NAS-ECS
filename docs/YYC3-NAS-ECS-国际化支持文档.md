# YYC³ NAS-ECS 国际化支持 (i18n)

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

> **文档编号**: YYC3-NAS-ECS-I18N-001
> **创建日期**: 2026-01-31
> **版本**: 1.0.0
> **作者**: YYC³ Team
> **更新日期**: 2026-01-31

---

## 📋 概述

YYC³ NAS-ECS 提供完整的国际化（i18n）支持，支持多语言切换，为全球用户提供本地化体验。

### 支持的语言

- 🇨🇳 简体中文 (zh-CN)
- 🇺🇸 English (en-US)

### 技术栈

- **i18next**: 国际化框架
- **react-i18next**: React 集成
- **i18next-browser-languagedetector**: 自动语言检测

---

## 🚀 安装依赖

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

---

## 📁 目录结构

```
src/app/i18n/
├── config.ts              # i18n 配置文件
├── hooks.ts               # 自定义 Hooks
├── LanguageSwitcher.tsx   # 语言切换器组件
├── locales/               # 语言资源文件
│   ├── zh-CN.json        # 简体中文
│   └── en-US.json        # 英文
└── index.ts              # 导出文件
```

---

## 🔧 配置说明

### 初始化配置

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });
```

### 语言检测策略

i18next 会按以下顺序检测用户语言：

1. **localStorage**: 用户手动选择的语言
2. **navigator**: 浏览器语言设置
3. **默认语言**: 系统默认语言

---

## 💻 使用方法

### 1. 基础使用

```typescript
import { useTranslation } from '@/app/i18n/hooks';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
    </div>
  );
}
```

### 2. 带参数的翻译

```typescript
const message = t('messages.welcomeBack', { name: 'John' });
```

### 3. 语言切换

```typescript
import { LanguageSwitcher } from '@/app/i18n/LanguageSwitcher';

function App() {
  return (
    <div>
      <LanguageSwitcher />
    </div>
  );
}
```

### 4. 使用自定义 Hook

```typescript
import { useI18n } from '@/app/i18n/hooks';

function MyComponent() {
  const { t, changeLanguage, getCurrentLanguage, formatDate } = useI18n();

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
  };

  const currentLang = getCurrentLanguage();
  const formattedDate = formatDate(new Date());

  return (
    <div>
      <p>{t('common.language')}: {currentLang?.name}</p>
      <p>{t('common.date')}: {formattedDate}</p>
    </div>
  );
}
```

### 5. 格式化函数

```typescript
const { formatNumber, formatCurrency, formatRelativeTime } = useI18n();

const number = formatNumber(1234.56);
const price = formatCurrency(99.99, 'USD');
const time = formatRelativeTime(-1, 'day');
```

---

## 📝 语言资源文件

### 结构说明

语言资源文件按模块组织，每个模块包含相关的翻译键：

```json
{
  "module": {
    "key": "翻译文本",
    "nested": {
      "key": "嵌套翻译文本"
    }
  }
}
```

### 添加新翻译

1. 在 `locales/zh-CN.json` 中添加中文翻译
2. 在 `locales/en-US.json` 中添加英文翻译
3. 在组件中使用 `t('module.key')` 引用

### 支持的模块

- `app`: 应用信息
- `nav`: 导航菜单
- `dashboard`: 仪表盘
- `monitor`: 系统监控
- `nas`: NAS管理
- `frp`: FRP配置
- `ddns`: DDNS服务
- `mail`: 邮件服务
- `llm`: AI对话
- `backup`: 备份管理
- `logs`: 日志管理
- `settings`: 系统设置
- `help`: 帮助中心
- `common`: 通用文本
- `errors`: 错误消息
- `messages`: 提示消息

---

## 🎨 组件集成

### 在导航栏中添加语言切换器

```typescript
import { LanguageSwitcher } from '@/app/i18n/LanguageSwitcher';

function Navigation() {
  return (
    <nav>
      <NavigationMenu />
      <LanguageSwitcher />
    </nav>
  );
}
```

### 在设置页面中添加语言选择

```typescript
import { useI18n } from '@/app/i18n/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function LanguageSettings() {
  const { supportedLanguages, changeLanguage, getCurrentLanguage } = useI18n();
  const currentLanguage = getCurrentLanguage();

  return (
    <div>
      <label>{t('settings.language')}</label>
      <Select
        value={currentLanguage?.code}
        onValueChange={changeLanguage}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

## 🔍 最佳实践

### 1. 翻译键命名

- 使用点号分隔的路径：`module.submodule.key`
- 使用驼峰命名：`userName`, `emailAddress`
- 保持一致性：统一使用复数或单数形式

### 2. 参数化翻译

```json
{
  "messages": {
    "welcome": "欢迎, {name}!",
    "itemCount": "共 {count} 个项目"
  }
}
```

```typescript
t('messages.welcome', { name: 'John' });
t('messages.itemCount', { count: 5 });
```

### 3. 复数形式

```json
{
  "messages": {
    "item_one": "1 个项目",
    "item_other": "{{count}} 个项目"
  }
}
```

### 4. 日期和时间格式

使用 `formatDate` 函数确保本地化：

```typescript
const { formatDate } = useI18n();
const date = formatDate(new Date(), {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

### 5. 数字和货币格式

使用 `formatNumber` 和 `formatCurrency` 函数：

```typescript
const { formatNumber, formatCurrency } = useI18n();
const price = formatCurrency(99.99, 'USD');
const percentage = formatNumber(0.75, { style: 'percent' });
```

---

## 🧪 测试

### 测试翻译功能

```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n/config';
import MyComponent from './MyComponent';

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('MyComponent', () => {
  it('displays translated text', () => {
    i18n.changeLanguage('en-US');
    renderWithI18n(<MyComponent />);
    expect(screen.getByText('English Text')).toBeInTheDocument();
  });
});
```

---

## 📚 相关文档

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [YYC³ 团队智能应用开发标准规范](../../.trae/rules/project_rules.md)

---

## 📞 联系方式

**技术支持**: <admin@0379.email>
**文档维护**: YYC³ 技术团队
**最后更新**: 2026-01-31

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
