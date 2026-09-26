# 贡献指南 (Contributing Guide)

> 感谢你对 **YYC³ NAS-ECS** 的关注！本文档指导你如何参与项目贡献。

## 目录

- [开发环境搭建](#开发环境搭建)
- [分支与提交规范](#分支与提交规范)
- [质量门禁](#质量门禁)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)
- [行为准则](#行为准则)

---

## 开发环境搭建

### 前置要求

| 依赖 | 版本 | 说明 |
| ---- | ---- | ---- |
| [Bun](https://bun.sh) | >= 1.1 | 包管理与脚本运行 |
| Python | >= 3.10 | 后端 API 服务 |
| Docker | >= 20.10 | 容器化部署（可选） |
| Git | >= 2.30 | 版本控制 |

### 步骤

```bash
# 1. 克隆仓库
git clone git@github.com:YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS

# 2. 安装前端依赖（项目统一使用 Bun + bun.lock）
bun install

# 3. 配置环境变量
cp .env.example .env          # 前端/脚本配置
cp api/.env.example api/.env  # 后端 API 配置

# 4. 启动开发服务器（端口从 3030 起）
bun run dev

# 5. 启动后端 API（可选）
cd api && python app.py
```

---

## 分支与提交规范

### 分支命名

```
main            # 生产分支（受保护，PR 合入）
develop         # 开发集成分支
feat/<scope>    # 新功能，如 feat/ai-widget
fix/<scope>     # 缺陷修复，如 fix/cors-policy
docs/<scope>    # 文档，如 docs/api-guide
chore/<scope>   # 工程化，如 chore/ci-tuning
```

### 提交信息（Conventional Commits）

格式：`type(scope): subject`

| 类型 | 用途 |
| ---- | ---- |
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 仅文档变更 |
| `refactor` | 重构（不改行为） |
| `perf` | 性能优化 |
| `test` | 测试补充/修正 |
| `chore` | 构建/工具/依赖 |
| `security` | 安全加固 |

示例：

```
feat(ai-widget): 支持浮窗位置记忆
fix(api): 生产环境强制显式 CORS_ORIGINS
docs(readme): 更新徽章与文档架构图
```

---

## 质量门禁

每次 PR 必须通过以下检查（与 CI 一致）：

| 检查项 | 命令 | 通过标准 |
| ------ | ---- | -------- |
| Lint | `bunx eslint src --ext .ts,.tsx,.js,.jsx` | 0 errors（warnings 宽限） |
| 类型检查 | `bun run type-check` | 逐步收敛中（当前宽限） |
| 单元测试 | `bun run test:run` | 全部通过 |
| 构建 | `bun run build` | 成功产出 dist/ |
| 密钥扫描 | gitleaks（CI 自动） | 0 泄漏 |

本地提交前建议执行：

```bash
bunx eslint src --ext .ts,.tsx && bun run test:run && bun run build
```

---

## Pull Request 流程

1. **Fork / 切分支**：从 `develop` 切出功能分支
2. **开发与自测**：遵循质量门禁，补充/更新对应测试
3. **提交 PR**：按模板填写变更说明、测试证据、自检清单
4. **代码审查**：至少 1 名维护者 Approve
5. **合入**：Squash merge 至 `develop`，定期批次合入 `main`

### PR 自检清单

- [ ] 代码遵循项目编码规范
- [ ] 已补充或更新测试
- [ ] 本地 lint / test / build 通过
- [ ] 无硬编码密钥、IP、密码（使用环境变量与占位符）
- [ ] 涉及配置变更时已同步 `.env.example` 与文档
- [ ] 文档（README / docs/）已同步更新

---

## 问题反馈

- **缺陷**：使用 [Bug Report 模板](.github/ISSUE_TEMPLATE/bug_report.yml)
- **新功能**：使用 [Feature Request 模板](.github/ISSUE_TEMPLATE/feature_request.yml)
- **安全问题**：**请勿公开披露**，参见 [SECURITY.md](SECURITY.md) 负责任披露流程

---

## 行为准则

参与本项目即表示你同意遵守 [Code of Conduct](CODE_OF_CONDUCT.md)。

---

<div align="center">

**YYC³** · 言启象限 | 语枢未来

</div>
