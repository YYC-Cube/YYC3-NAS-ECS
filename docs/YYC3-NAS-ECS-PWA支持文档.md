# YYC³ NAS-ECS PWA 支持

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

> **文档编号**: YYC3-NAS-ECS-PWA-001
> **创建日期**: 2026-01-31
> **版本**: 2.0.0
> **作者**: YYC³ Team
> **更新日期**: 2026-01-31

---

## 📋 概述

YYC³ NAS-ECS 提供完整的渐进式 Web 应用（PWA）支持，允许用户将应用安装到设备上，享受类似原生应用的体验。

### PWA 特性

- ✅ **离线支持**: 缓存静态资源和 API 响应
- ✅ **可安装**: 支持桌面和移动设备安装
- ✅ **推送通知**: 支持浏览器推送通知
- ✅ **自动更新**: 检测并提示应用更新
- ✅ **快速启动**: 预缓存关键资源
- ✅ **响应式设计**: 适配各种设备尺寸

---

## 🏗️ 架构设计

### Service Worker 架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Service Worker 生命周期                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   Install    │ ──→ 预缓存静态资源                                         │
│  └──────┬───────┘                                                           │
│         ↓                                                                   │
│  ┌──────────────┐                                                           │
│  │   Activate   │ ──→ 清理旧缓存，接管页面                                    │
│  └──────┬───────┘                                                           │
│         ↓                                                                   │
│  ┌──────────────┐                                                           │
│  │    Fetch     │ ──→ 拦截网络请求，提供缓存策略                               │
│  └──────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 缓存策略

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           缓存策略 (Cache Strategy)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  静态资源 (Static Assets)                                                  │
│  ┌──────────────┐                                                           │
│  │ Cache First  │ ──→ 优先使用缓存，失败则网络请求                            │
│  └──────────────┘                                                           │
│                                                                             │
│  API 请求 (API Requests)                                                     │
│  ┌──────────────┐                                                           │
│  │ Network First│ ──→ 优先网络请求，失败则使用缓存                            │
│  └──────────────┘                                                           │
│                                                                             │
│  运行时缓存 (Runtime Cache)                                                   │
│  ┌──────────────┐                                                           │
│  │ Stale While  │ ──→ 返回缓存，后台更新                                     │
│  │ Revalidate   │                                                           │
│  └──────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
public/
├── sw.js                    # Service Worker 文件
└── manifest.json            # PWA 清单文件

src/app/pwa/
├── register.ts             # PWA 注册函数
├── PWAUpdatePrompt.tsx    # 更新提示组件
├── PWAInstallPrompt.tsx   # 安装提示组件
└── index.ts               # 导出文件
```

---

## 🔧 配置说明

### Manifest 配置

```json
{
  "name": "YYC³ NAS-ECS 企业管理平台",
  "short_name": "YYC³ NAS-ECS",
  "description": "言启象限 | 语枢未来 - 企业级NAS-ECS管理系统",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/yyc3-pwa-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "utilities"],
  "lang": "zh-CN"
}
```

### Service Worker 配置

```typescript
const CACHE_NAME = 'yyc3-nas-ecs-v1';
const RUNTIME_CACHE = 'yyc3-nas-ecs-runtime-v1';

const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/yyc3-pwa-icon.png',
];

const API_CACHE_URLS = [
  '/api/v2/system/stats',
  '/api/v2/monitoring/stats',
];
```

---

## 💻 使用方法

### 1. 注册 Service Worker

```typescript
import { registerSW } from '@/app/pwa/register';

registerSW();
```

### 2. 使用 PWA 组件

```typescript
import { PWAInstallPrompt, PWAUpdatePrompt } from '@/app/pwa';

function App() {
  return (
    <div>
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}
```

### 3. 请求通知权限

```typescript
import { requestNotificationPermission } from '@/app/pwa/register';

async function enableNotifications() {
  const granted = await requestNotificationPermission();
  if (granted) {
    console.log('Notifications enabled');
  }
}
```

### 4. 订阅推送通知

```typescript
import { subscribeToPush } from '@/app/pwa/register';

async function subscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await subscribeToPush(
    registration,
    'YOUR_VAPID_PUBLIC_KEY'
  );
  console.log('Push subscription:', subscription);
}
```

### 5. 清除缓存

```typescript
import { clearCache } from '@/app/pwa/register';

async function clearAppCache() {
  await clearCache();
  console.log('Cache cleared');
}
```

---

## 🎨 组件集成

### 在主应用中集成

```typescript
import React from 'react';
import { PWAInstallPrompt, PWAUpdatePrompt } from '@/app/pwa';
import { registerSW } from '@/app/pwa/register';

function App() {
  React.useEffect(() => {
    registerSW();
  }, []);

  return (
    <div>
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}

export default App;
```

### 在导航栏中添加安装按钮

```typescript
import { PWAInstallPrompt } from '@/app/pwa';

function Navigation() {
  return (
    <nav>
      <NavigationMenu />
      <PWAInstallPrompt />
    </nav>
  );
}
```

---

## 🔍 最佳实践

### 1. 缓存策略选择

- **静态资源**: 使用 Cache First 策略
- **API 请求**: 使用 Network First 策略
- **频繁更新数据**: 使用 Stale While Revalidate 策略

### 2. 缓存版本管理

```typescript
const CACHE_NAME = `yyc3-nas-ecs-v${VERSION}`;

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

### 3. 离线回退

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      });
    })
  );
});
```

### 4. 推送通知优化

```typescript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/yyc3-pwa-icon.png',
    badge: '/yyc3-pwa-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

---

## 🧪 测试

### 测试 Service Worker

```typescript
describe('Service Worker', () => {
  it('should register service worker', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration).toBeDefined();
  });

  it('should cache static assets', async () => {
    const cache = await caches.open('yyc3-nas-ecs-v1');
    const response = await cache.match('/');
    expect(response).toBeDefined();
  });
});
```

### 测试 PWA 安装

```typescript
describe('PWA Install', () => {
  it('should show install prompt', () => {
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
    expect(deferredPrompt).toBeDefined();
  });
});
```

---

## 📊 性能优化

### 1. 预缓存关键资源

```typescript
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/yyc3-pwa-icon.png',
  '/src/main.tsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS);
    })
  );
});
```

### 2. 懒加载非关键资源

```typescript
const LAZY_LOAD_ASSETS = [
  '/src/components/HeavyComponent.tsx',
];

self.addEventListener('fetch', (event) => {
  if (LAZY_LOAD_ASSETS.includes(event.request.url)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, response.clone());
        return response;
      })
    );
  }
});
```

### 3. 压缩响应

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      const compressed = response.clone();
      return compressed;
    })
  );
});
```

---

## 🔒 安全考虑

### 1. HTTPS 要求

PWA 必须通过 HTTPS 提供（localhost 除外）：

```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
```

### 2. 作用域限制

Service Worker 只能控制其注册路径下的资源：

```typescript
navigator.serviceWorker.register('/sw.js', {
  scope: '/',
});
```

### 3. 敏感数据保护

不要缓存敏感数据：

```typescript
const SENSITIVE_PATHS = ['/api/v2/auth', '/api/v2/user'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (SENSITIVE_PATHS.some(path => url.pathname.startsWith(path))) {
    event.respondWith(fetch(event.request));
    return;
  }
});
```

---

## 📚 相关文档

- [MDN Web Docs - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev - PWA Best Practices](https://web.dev/pwa/)
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
