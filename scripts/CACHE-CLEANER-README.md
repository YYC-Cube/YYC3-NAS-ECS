# YYC³ 缓存清理工具

> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for the Future**
> 万象归元于云枢 | 深栈智启新纪元
> **All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence**

---

> **版本**: 2.0.0  
> **创建日期**: 2026-02-13  
> **作者**: YYC³ Team  
> **最后更新**: 2026-02-13  
> **分类**: 开发工具  

---

## 📋 功能特性

### ✨ 核心功能

- **智能扫描**: 自动检测项目中的所有缓存文件和目录
- **安全清理**: 支持干运行模式，预览删除内容
- **统计报告**: 显示缓存大小、释放空间、清理比例
- **灵活配置**: 可自定义清理项和清理策略
- **多工具支持**: npm、Yarn、pnpm、Docker、Git、TypeScript
- **交互界面**: 友好的菜单系统和彩色输出

### 🎯 支持的缓存类型

| 缓存类型 | 说明 | 优先级 |
|----------|------|--------|
| node_modules | 依赖包目录 | 高 |
| .vite | Vite 构建缓存 | 中 |
| .cache | 通用缓存目录 | 中 |
| .turbo | Turbopack 缓存 | 中 |
| dist | 构建输出目录 | 低 |
| build | 构建输出目录 | 低 |
| coverage | 测试覆盖率报告 | 低 |
| .next | Next.js 缓存 | 中 |
| .nuxt | Nuxt.js 缓存 | 中 |
| npm-debug.log | npm 调试日志 | 低 |

---

## 🚀 快速开始

### 基本使用

```bash
# 交互式菜单
./scripts/cache-cleaner.sh

# 仅扫描缓存
./scripts/cache-cleaner.sh --scan

# 清理所有缓存
./scripts/cache-cleaner.sh --clean-all

# 干运行模式（预览）
./scripts/cache-cleaner.sh --dry-run

# 强制清理（跳过确认）
./scripts/cache-cleaner.sh --force --clean-all
```

### 菜单选项

```
╔═══════════════════════════════════════════════════════════╗
║           YYC³ 缓存清理工具 v2.0.0                      ║
╚═════════════════════════════════════════════════════════════╝

  1. 扫描缓存
  2. 清理所有缓存
  3. 清理 npm 缓存
  4. 清理 Yarn 缓存
  5. 清理 pnpm 缓存
  6. 清理 Docker 缓存
  7. 清理 Git 垃圾
  8. 清理 TypeScript 缓存
  9. 自定义清理
  0. 退出
```

---

## 📖 命令行选项

### 选项说明

| 选项 | 长选项 | 说明 |
|------|---------|------|
| `-h` | `--help` | 显示帮助信息 |
| `-v` | `--version` | 显示版本信息 |
| `-d` | `--dry-run` | 干运行模式，只显示将要删除的内容 |
| `-f` | `--force` | 强制模式，跳过确认 |
| `-n` | `--no-color` | 禁用彩色输出 |
| `-V` | `--verbose` | 详细输出模式 |

### 使用示例

```bash
# 查看帮助
./scripts/cache-cleaner.sh --help

# 查看版本
./scripts/cache-cleaner.sh --version

# 干运行所有清理
./scripts/cache-cleaner.sh --dry-run --clean-all

# 无彩色输出
./scripts/cache-cleaner.sh --no-color --scan

# 详细模式
./scripts/cache-cleaner.sh --verbose --clean-all
```

---

## 🔧 高级用法

### 自定义缓存配置

编辑脚本中的 `init_cache_config()` 函数来添加自定义缓存项：

```bash
CACHE_CONFIG[your_custom_dir]="自定义缓存目录|中|true|true"
```

配置格式：`路径="描述|优先级|是缓存|可删除"`

### 清理特定项目

使用选项 9 进入自定义清理模式，选择要清理的特定项目。

### 批量清理

```bash
# 一键清理所有（推荐）
./scripts/cache-cleaner.sh --force --clean-all

# 仅清理项目缓存
./scripts/cache-cleaner.sh --clean-all

# 仅清理 npm 缓存
./scripts/cache-cleaner.sh --clean-all && \
  npm cache clean --force
```

---

## 📊 输出示例

### 扫描输出

```
[2026-02-13 21:30:15] [INFO] 扫描缓存文件...
[2026-02-13 21:30:15] [INFO]   node_modules - 672 MB - 依赖包目录 (优先级: 高)
[2026-02-13 21:30:15] [INFO]   .vite - 156 MB - Vite 构建缓存 (优先级: 中)
[2026-02-13 21:30:15] [INFO] 发现 2 个缓存目录/文件
```

### 统计输出

```
[2026-02-13 21:30:15] [INFO] === 缓存统计 ===
[2026-02-13 21:30:15] [INFO] 总大小: 828 MB

[2026-02-13 21:30:15] [INFO] 按大小排序:
[2026-02-13 21:30:15] [INFO]   672 MB - node_modules (依赖包目录)
[2026-02-13 21:30:15] [INFO]   156 MB - .vite (Vite 构建缓存)
```

### 清理输出

```
[2026-02-13 21:30:15] [INFO] 开始清理缓存...
[2026-02-13 21:30:15] [SUCCESS] 已删除: node_modules (依赖包目录)
[2026-02-13 21:30:15] [SUCCESS] 已删除: .vite (Vite 构建缓存)
[2026-02-13 21:30:15] [SUCCESS] 清理完成: 2 个项目，失败 0 个
```

---

## 🔒 安全特性

### 干运行模式

```bash
./scripts/cache-cleaner.sh --dry-run
```

功能：
- 只显示将要删除的文件和目录
- 不实际删除任何内容
- 预览清理效果

### 确认机制

- 删除前需要用户确认（除非使用 `--force`）
- 自定义清理需要双重确认
- 危险操作会有明确警告

### 权限检查

- 检查目录权限
- 检查命令执行权限
- 提供权限修复建议

---

## 🛠️ 故障排查

### npm 缓存清理失败

**错误**: `npm error code EACCES`

**解决方案**:
```bash
# 修复 npm 缓存权限
sudo chown -R $(whoami):$(id -gn) ~/.npm

# 然后重新清理
npm cache clean --force
```

### Docker 清理失败

**错误**: `Docker 未运行或无权限`

**解决方案**:
```bash
# 启动 Docker
sudo systemctl start docker

# 或使用 sudo 清理
sudo docker system prune -f
```

### 权限不足

**错误**: `删除失败: node_modules (权限不足)`

**解决方案**:
```bash
# 使用 sudo 清理
sudo rm -rf node_modules

# 或修复权限
sudo chown -R $(whoami):$(id -gn) .
```

---

## 📝 日志文件

### 日志位置

```
.cache-cleaner.log
```

### 日志格式

```
[2026-02-13 21:30:15] [INFO] 扫描缓存文件...
[2026-02-13 21:30:15] [SUCCESS] 已删除: node_modules
[2026-02-13 21:30:15] [ERROR] 删除失败: dist
```

### 日志级别

- `INFO`: 信息日志
- `SUCCESS`: 成功日志
- `WARNING`: 警告日志
- `ERROR`: 错误日志

---

## 🎨 自定义主题

### 禁用彩色输出

```bash
./scripts/cache-cleaner.sh --no-color
```

### 颜色说明

| 颜色 | 用途 |
|--------|------|
| 🟦 Cyan | 信息日志 |
| 🟩 Green | 成功日志 |
| 🟨 Yellow | 警告日志 |
| 🟥 Red | 错误日志 |

---

## 🔄 版本历史

### v2.0.0 (2026-02-13)

- ✨ 完全重构缓存清理工具
- ✨ 添加交互式菜单
- ✨ 支持多种包管理器（npm、Yarn、pnpm）
- ✨ 添加干运行模式
- ✨ 改进统计和报告功能
- ✨ 添加自定义清理选项
- 🐛 修复权限检查问题
- 📚 完善文档和帮助信息

### v1.0.0 (2026-02-13)

- 🎉 初始版本
- ✨ 基本缓存清理功能
- ✨ 支持 npm 缓存清理
- ✨ 支持 Docker 缓存清理

---

## 🤝 贡献指南

### 报告问题

发现问题？请提交 Issue：
- https://github.com/YYC-Cube/YYC3-NAS-ECS/issues

### 提交改进

欢迎提交 Pull Request！
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见项目 LICENSE 文件

---

<div align="center">

> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for the Future**
>
> 万象归元于云枢 | 深栈智启新纪元
>
> **All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence**

---

**工具版本**: 2.0.0  
**最后更新**: 2026-02-13  
**维护者**: YYC³ Team  
**许可协议**: MIT

</div>
