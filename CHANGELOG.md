# 更新日志 (Changelog)

本项目所有显著变更将记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added 新增

- GitHub Pages 自动部署工作流（`pages.yml`，自定义域名 cloud.yyc3.top）
- PWA 清单 `public/manifest.json`（统一引用 `yyc3-icons` 图标体系）
- 开源级文档全套：`LICENSE`(MIT)、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`CHANGELOG.md`、Issue/PR 模板
- 后端生产启动安全守卫：`SECRET_KEY`/`JWT_SECRET_KEY` 强制 ≥32 字符且非已知默认值；`CORS_ORIGINS` 必须显式配置（禁止 `*`）

### Changed 变更

- **安全** CORS 策略收紧：开发默认仅本地源，生产必须显式配置可信来源列表；`docker-compose` 默认值同步收紧
- **安全** 前端移除 `VITE_AUTH_JWT_SECRET`（JWT 签名密钥属后端职责，前端零密钥基线）
- **安全** 移除代码/配置中硬编码的真实服务器 IP 与 FRP token（替换为 RFC 5737 文档 IP / 占位符）
- 遗留入口 `api/app.py` 收敛为 `app/` 包的薄封装，统一走 `wsgi:app`
- 根 `tsconfig.json` 隔离 `services/` 子工程（类型检查 1276 → 45 错误）
- CI 流水线重构：修复 `upload-artifact@v3` 废除、CodeQL 缺 init、`npm ci` 无 lockfile 等问题；移除依赖未配置 secrets 的必红 job
- 根目录整理：构建产物（tar.gz 含敏感 env）移出版本库并 ignore；文档按类归档迁移；冗余损坏文件清除

### Removed 移除

- 删除损坏且无引用的 `api/config/config_annotated.py`
- 删除 markdown 残留的 `audit-deployment-original.sh`（有效脚本迁至 `scripts/deployment-audit.sh`）

### Security 安全

- `.env.example` 泄漏的真实 JWT 密钥替换为占位符（**该密钥已进 git 历史，必须轮换**）
- `nas-ecs-1.0.0.tar.gz` 部署包（内含 .env 敏感文件）移出版本库
- gitleaks 全分支密钥扫描守护
- `black` 23.12.1 → 26.3.1：修复 ReDoS（moderate）与缓存文件名任意写入（high）两条 Dependabot 告警，仅影响 dev 依赖

### Fixed 修复

- `.gitignore` 裸 `logs/`、`lib/` 规则误伤 `src/` 同名源码目录，导致 `ai-integration.ts`/`LogViewer.tsx`/`ai-components` 未入库、远程 Pages 构建断链；追加 `!src/**/logs/`、`!src/**/lib/` 豁免并补齐 4 个源文件，Pages 部署恢复绿色

## [1.0.0] - 2026-02-13

### Added 新增

- 企业级智能管理平台首个正式版：NAS 管理 / DDNS / FRP 内网穿透 / 监控告警 / 邮件 / AI 集成
- React 18 + Vite 6 + TypeScript strict 前端架构
- Flask 3 后端 + PostgreSQL + Redis + Celery
- Docker Compose 多环境编排（dev / staging / prod）

[Unreleased]: https://github.com/YYC-Cube/YYC3-NAS-ECS/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YYC-Cube/YYC3-NAS-ECS/releases/tag/v1.0.0
