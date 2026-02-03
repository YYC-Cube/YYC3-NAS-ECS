# YYC³ NAS-ECS 测试用例规范

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

**创建日期**：2026-02-03
**作者**：YYC³ Team
**版本**：1.0.0
**更新日期**：2026-02-03

---

## 📋 目录

- [测试用例模板](#测试用例模板)
- [测试用例设计原则](#测试用例设计原则)
- [测试用例命名规范](#测试用例命名规范)
- [测试用例管理流程](#测试用例管理流程)
- [测试用例评审标准](#测试用例评审标准)

---

## 📝 测试用例模板

### 单元测试用例模板

#### 基本结构

```typescript
/**
 * @file [服务/组件名称]测试
 * @description 测试[服务/组件]的核心功能
 * @module __tests__/[模块路径]/[文件名].test
 * @author YYC³
 * @version 1.0.0
 * @created [创建日期 YYYY-MM-DD]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { [Service/Component] } from '../[文件路径]';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('[Service/Component名称]', () => {
  let [service/component]: [Service/Component];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    [service/component] = new [Service/Component]();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('[功能模块名称]', () => {
    it('应该[预期行为]', () => {
      // 准备测试数据
      const testData = { };

      // 执行测试操作
      const result = [service/component].[方法](testData);

      // 验证测试结果
      expect(result).toBeDefined();
      expect(result).toEqual([预期结果]);
    });

    it('应该处理[边界情况]', () => {
      // 准备边界测试数据
      const boundaryData = { };

      // 执行测试操作
      const result = [service/component].[方法](boundaryData);

      // 验证测试结果
      expect(result).toBeDefined();
      expect(result).toEqual([预期结果]);
    });

    it('应该抛出错误当[异常情况]', () => {
      // 准备异常测试数据
      const invalidData = { };

      // 执行测试操作并验证异常
      expect(() => [service/component].[方法](invalidData)).toThrow();
    });
  });
});
```

#### 示例

```typescript
/**
 * @file 日志服务测试
 * @description 测试日志服务的核心功能
 * @module __tests__/services/logService.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-02-03
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogService } from '../logService';
import { LogLevel, LogCategory } from '../../types/logs';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('LogService', () => {
  let logService: LogService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    logService = new LogService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('日志添加功能', () => {
    it('应该成功添加日志', () => {
      const log = {
        level: LogLevel.Info,
        message: 'Test message',
        source: 'test',
        category: LogCategory.GENERAL
      };

      logService.addLog(log);

      const logs = logService.queryLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(log);
    });

    it('应该处理空消息', () => {
      const log = {
        level: LogLevel.Info,
        message: '',
        source: 'test',
        category: LogCategory.GENERAL
      };

      logService.addLog(log);

      const logs = logService.queryLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('');
    });

    it('应该抛出错误当日志无效时', () => {
      const invalidLog = {
        level: 'invalid',
        message: 'Test message',
        source: 'test',
        category: LogCategory.GENERAL
      } as any;

      expect(() => logService.addLog(invalidLog)).toThrow();
    });
  });

  describe('日志查询功能', () => {
    it('应该查询所有日志', () => {
      logService.addLog({ level: LogLevel.Info, message: 'Info', source: 'test', category: LogCategory.GENERAL });
      logService.addLog({ level: LogLevel.Error, message: 'Error', source: 'test', category: LogCategory.GENERAL });

      const logs = logService.queryLogs();
      expect(logs).toHaveLength(2);
    });

    it('应该按级别筛选日志', () => {
      logService.addLog({ level: LogLevel.Info, message: 'Info', source: 'test', category: LogCategory.GENERAL });
      logService.addLog({ level: LogLevel.Error, message: 'Error', source: 'test', category: LogCategory.GENERAL });

      const errorLogs = logService.queryLogs({ level: LogLevel.Error });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.Error);
    });

    it('应该按类别筛选日志', () => {
      logService.addLog({ level: LogLevel.Info, message: 'Info', source: 'test', category: LogCategory.MONITORING });
      logService.addLog({ level: LogLevel.Error, message: 'Error', source: 'test', category: LogCategory.GENERAL });

      const monitoringLogs = logService.queryLogs({ category: LogCategory.MONITORING });
      expect(monitoringLogs).toHaveLength(1);
      expect(monitoringLogs[0].category).toBe(LogCategory.MONITORING);
    });
  });
});
```

### 集成测试用例模板

#### 基本结构

```typescript
/**
 * @file [模块名称]集成测试
 * @description 测试[模块]的集成功能
 * @module __tests__/[模块路径]/[文件名].integration.test
 * @author YYC³
 * @version 1.0.0
 * @created [创建日期 YYYY-MM-DD]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { [Service1], [Service2] } from '../[文件路径]';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('[模块名称]集成测试', () => {
  let [service1]: [Service1];
  let [service2]: [Service2];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    [service1] = new [Service1]();
    [service2] = new [Service2]();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('[功能模块名称]', () => {
    it('应该[预期行为]', async () => {
      // 准备测试数据
      const testData = { };

      // 执行测试操作
      const result1 = await [service1].[方法](testData);
      const result2 = await [service2].[方法](result1);

      // 验证测试结果
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result2).toEqual([预期结果]);
    });

    it('应该处理[边界情况]', async () => {
      // 准备边界测试数据
      const boundaryData = { };

      // 执行测试操作
      const result = await [service1].[方法](boundaryData);

      // 验证测试结果
      expect(result).toBeDefined();
      expect(result).toEqual([预期结果]);
    });

    it('应该抛出错误当[异常情况]', async () => {
      // 准备异常测试数据
      const invalidData = { };

      // 执行测试操作并验证异常
      await expect([service1].[方法](invalidData)).rejects.toThrow();
    });
  });
});
```

#### 示例

```typescript
/**
 * @file API模块集成测试
 * @description 测试API模块的集成功能
 * @module __tests__/services/api-v2.integration.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-02-03
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../api-v2';
import { LogService } from '../logService';
import { LogCategory } from '../../types/logs';

describe.skip('API模块集成测试', () => {
  let logService: LogService;

  beforeEach(() => {
    logService = new LogService();
    logService.clearLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('系统监控API集成', () => {
    it('应该获取系统状态', async () => {
      const stats = await api.system.getStats();
      expect(stats).toBeDefined();
    });

    it('应该获取系统详细信息', async () => {
      const stats = await api.system.getDetailedStats();
      expect(stats).toBeDefined();
    });

    it('应该记录系统监控操作到日志', async () => {
      await api.system.getStats();

      const logs = logService.queryLogs({
        category: LogCategory.MONITORING
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('FRP管理API集成', () => {
    it('应该获取FRP配置列表', async () => {
      const configs = await api.frp.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('应该更新FRP配置', async () => {
      const configs = await api.frp.getConfigs();
      if (configs.length > 0) {
        const updated = await api.frp.updateConfig({
          ...configs[0],
          enabled: !configs[0].enabled
        });
        expect(updated).toBeDefined();
      }
    });
  });
});
```

### E2E测试用例模板

#### 基本结构

```typescript
/**
 * @file [功能名称]E2E测试
 * @description 测试[功能]的端到端流程
 * @module e2e/[文件名].spec
 * @author YYC³
 * @version 1.0.0
 * @created [创建日期 YYYY-MM-DD]
 */

import { test, expect } from '@playwright/test';

test.describe('[功能名称]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('应该[预期行为]', async ({ page }) => {
    // 执行用户操作
    await page.fill('[选择器]', '[输入值]');
    await page.click('[选择器]');

    // 验证页面状态
    await expect(page).toHaveURL('[预期URL]');
    await expect(page.locator('[选择器]')).toContainText('[预期文本]');
  });

  test('应该处理[边界情况]', async ({ page }) => {
    // 执行边界操作
    await page.fill('[选择器]', '[边界值]');
    await page.click('[选择器]');

    // 验证页面状态
    await expect(page.locator('[选择器]')).toContainText('[预期文本]');
  });

  test('应该显示错误当[异常情况]', async ({ page }) => {
    // 执行异常操作
    await page.fill('[选择器]', '[无效值]');
    await page.click('[选择器]');

    // 验证错误显示
    await expect(page.locator('[错误选择器]')).toContainText('[错误信息]');
  });
});
```

#### 示例

```typescript
/**
 * @file 用户登录E2E测试
 * @description 测试用户登录的端到端流程
 * @module e2e/login.spec
 * @author YYC³
 * @version 1.0.0
 * @created 2026-02-03
 */

import { test, expect } from '@playwright/test';

test.describe('用户登录流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('应该成功登录', async ({ page }) => {
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    await expect(page.locator('.welcome-message')).toContainText('Welcome, admin');
  });

  test('应该显示错误当密码错误', async ({ page }) => {
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('用户名或密码错误');
  });

  test('应该显示错误当用户不存在', async ({ page }) => {
    await page.fill('input[name="username"]', 'nonexistent');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('用户名或密码错误');
  });
});
```

---

## 🎯 测试用例设计原则

### 1. 独立性原则

**原则**：每个测试用例应该独立运行，不依赖其他测试用例。

**示例**：

```typescript
// ✅ 推荐
describe('LogService', () => {
  let logService: LogService;

  beforeEach(() => {
    logService = new LogService();
  });

  it('应该添加日志1', () => {
    logService.addLog({ level: 'info', message: 'Test 1', source: 'test', category: 'general' });
    expect(logService.queryLogs()).toHaveLength(1);
  });

  it('应该添加日志2', () => {
    logService.addLog({ level: 'info', message: 'Test 2', source: 'test', category: 'general' });
    expect(logService.queryLogs()).toHaveLength(1);
  });
});

// ❌ 不推荐
describe('LogService', () => {
  const logService = new LogService();

  it('应该添加日志1', () => {
    logService.addLog({ level: 'info', message: 'Test 1', source: 'test', category: 'general' });
    expect(logService.queryLogs()).toHaveLength(1);
  });

  it('应该添加日志2', () => {
    logService.addLog({ level: 'info', message: 'Test 2', source: 'test', category: 'general' });
    expect(logService.queryLogs()).toHaveLength(2);
  });
});
```

### 2. 可重复性原则

**原则**：每个测试用例应该可以重复运行，结果一致。

**示例**：

```typescript
// ✅ 推荐
describe('LogService', () => {
  let logService: LogService;

  beforeEach(() => {
    logService = new LogService();
  });

  it('应该添加日志', () => {
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });
});

// ❌ 不推荐
describe('LogService', () => {
  let logService: LogService;

  beforeEach(() => {
    logService = new LogService();
  });

  it('应该添加日志', () => {
    const log = { level: 'info', message: `Test ${Date.now()}`, source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });
});
```

### 3. 清晰性原则

**原则**：每个测试用例应该清晰表达测试意图。

**示例**：

```typescript
// ✅ 推荐
describe('LogService', () => {
  it('应该成功添加日志', () => {
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });

  it('应该按级别筛选日志', () => {
    logService.addLog({ level: 'info', message: 'Info', source: 'test', category: 'general' });
    logService.addLog({ level: 'error', message: 'Error', source: 'test', category: 'general' });
    const errorLogs = logService.queryLogs({ level: 'error' });
    expect(errorLogs).toHaveLength(1);
  });
});

// ❌ 不推荐
describe('LogService', () => {
  it('测试1', () => {
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });

  it('测试2', () => {
    logService.addLog({ level: 'info', message: 'Info', source: 'test', category: 'general' });
    logService.addLog({ level: 'error', message: 'Error', source: 'test', category: 'general' });
    const errorLogs = logService.queryLogs({ level: 'error' });
    expect(errorLogs).toHaveLength(1);
  });
});
```

### 4. 完整性原则

**原则**：每个测试用例应该覆盖完整的测试场景。

**示例**：

```typescript
// ✅ 推荐
describe('LogService', () => {
  it('应该添加日志', () => {
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });

  it('应该处理空消息', () => {
    const log = { level: 'info', message: '', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });

  it('应该抛出错误当日志无效时', () => {
    const invalidLog = { level: 'invalid', message: 'Test', source: 'test', category: 'general' } as any;
    expect(() => logService.addLog(invalidLog)).toThrow();
  });
});

// ❌ 不推荐
describe('LogService', () => {
  it('应该添加日志', () => {
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });
});
```

### 5. 快速性原则

**原则**：每个测试用例应该快速执行，提高测试效率。

**示例**：

```typescript
// ✅ 推荐
describe('LogService', () => {
  it('应该添加日志', () => {
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    expect(logService.queryLogs()).toHaveLength(1);
  });
});

// ❌ 不推荐
describe('LogService', () => {
  it('应该添加日志', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const log = { level: 'info', message: 'Test', source: 'test', category: 'general' };
    logService.addLog(log);
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(logService.queryLogs()).toHaveLength(1);
  });
});
```

---

## 📝 测试用例命名规范

### 命名规则

#### 1. 测试文件命名

**规则**：`[模块名称].test.ts` 或 `[模块名称].integration.test.ts` 或 `[模块名称].spec.ts`

**示例**：

```
logService.test.ts
rbacService.test.ts
api-v2.integration.test.ts
login.spec.ts
```

#### 2. 测试套件命名

**规则**：使用 `describe` 函数，名称应该清晰表达测试范围。

**格式**：`'[服务/组件名称]'` 或 `'[功能模块名称]'`

**示例**：

```typescript
describe('LogService', () => { });
describe('RBACService', () => { });
describe('日志添加功能', () => { });
describe('用户登录功能', () => { });
```

#### 3. 测试用例命名

**规则**：使用 `it` 函数，名称应该清晰表达测试意图。

**格式**：`'应该[预期行为]'` 或 `'应该处理[边界情况]'` 或 `'应该抛出错误当[异常情况]'`

**示例**：

```typescript
it('应该成功添加日志', () => { });
it('应该按级别筛选日志', () => { });
it('应该处理空消息', () => { });
it('应该抛出错误当日志无效时', () => { });
```

### 命约定语

#### 1. 正向测试

**约定**：使用 `应该` 开头，表达预期的正向行为。

**示例**：

```typescript
it('应该成功添加日志', () => { });
it('应该正确计算结果', () => { });
it('应该返回有效数据', () => { });
```

#### 2. 负向测试

**约定**：使用 `应该抛出错误当` 开头，表达预期的负向行为。

**示例**：

```typescript
it('应该抛出错误当日志无效时', () => { });
it('应该返回空数组当数据不存在时', () => { });
it('应该拒绝无效输入', () => { });
```

#### 3. 边界测试

**约定**：使用 `应该处理` 开头，表达边界情况的处理。

**示例**：

```typescript
it('应该处理空消息', () => { });
it('应该处理最大长度', () => { });
it('应该处理零值', () => { });
```

---

## 🔄 测试用例管理流程

### 创建流程

#### 步骤1：需求分析

**任务**：分析需求规格，确定测试范围。

**输出**：测试需求文档

**责任人**：测试工程师

#### 步骤2：测试用例设计

**任务**：根据测试需求设计测试用例。

**输出**：测试用例草案

**责任人**：测试工程师

#### 步骤3：测试用例实现

**任务**：根据测试用例草案实现测试代码。

**输出**：测试用例代码

**责任人**：测试工程师

#### 步骤4：测试用例评审

**任务**：评审测试用例，确保测试用例质量。

**输出**：评审意见

**责任人**：测试负责人、代码审核者

#### 步骤5：测试用例批准

**任务**：批准测试用例，准备执行。

**输出**：批准的测试用例

**责任人**：测试负责人

### 维护流程

#### 步骤1：需求变更

**任务**：当需求变更时，更新测试用例。

**输出**：更新的测试用例

**责任人**：测试工程师

#### 步骤2：缺陷修复

**任务**：当缺陷修复时，更新测试用例。

**输出**：更新的测试用例

**责任人**：测试工程师

#### 步骤3：代码重构

**任务**：当代码重构时，更新测试用例。

**输出**：更新的测试用例

**责任人**：测试工程师

---

## ✅ 测试用例评审标准

### 评审检查清单

#### 1. 功能完整性

- [ ] 测试用例覆盖所有需求
- [ ] 测试用例覆盖所有功能
- [ ] 测试用例覆盖所有场景
- [ ] 测试用例覆盖所有边界

#### 2. 测试独立性

- [ ] 测试用例独立运行
- [ ] 测试用例不依赖其他测试
- [ ] 测试用例可以重复运行
- [ ] 测试用例结果一致

#### 3. 测试清晰性

- [ ] 测试用例名称清晰
- [ ] 测试用例意图明确
- [ ] 测试用例注释完整
- [ ] 测试用例结构清晰

#### 4. 测试完整性

- [ ] 测试用例准备完整
- [ ] 测试用例执行完整
- [ ] 测试用例验证完整
- [ ] 测试用例清理完整

#### 5. 测试性能

- [ ] 测试用例执行快速
- [ ] 测试用例资源占用低
- [ ] 测试用例稳定性高
- [ ] 测试用例可维护性强

### 评审标准

| 标准 | 目标值 | 评分 |
|------|--------|------|
| 功能完整性 | 100% | 0-100分 |
| 测试独立性 | 100% | 0-100分 |
| 测试清晰性 | 100% | 0-100分 |
| 测试完整性 | 100% | 0-100分 |
| 测试性能 | 100% | 0-100分 |
| **总分** | **≥400分** | **0-500分** |

### 评审流程

1. **自审**：测试工程师自审测试用例
2. **互审**：测试工程师互审测试用例
3. **负责人审**：测试负责人审核测试用例
4. **批准**：测试负责人批准测试用例

---

## 📚 相关文档

- [YYC³ NAS-ECS 测试策略](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试策略.md)
- [YYC³ NAS-ECS 测试计划](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试计划.md)
- [YYC³ NAS-ECS 测试环境配置](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试环境配置.md)
- [YYC³ NAS-ECS 缺陷管理流程](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-缺陷管理流程.md)
- [YYC³ NAS-ECS 测试报告模板](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试报告模板.md)
- [YYC³ NAS-ECS 测试覆盖率管理](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试覆盖率管理.md)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
