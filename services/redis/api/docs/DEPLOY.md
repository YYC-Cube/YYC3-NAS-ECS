# 🚀 部署指南 · RediOps API

本项目由言语团队构建，法人 Yu 主导。以下为部署步骤说明。

---

## 📦 环境要求

- Node.js ≥ 18.x
- MySQL ≥ 5.7
- Git ≥ 2.x
- `.env` 文件配置完整（可使用 `.env.example` 模板）

---

## 🧱 初始化步骤

```bash
# 克隆项目
git clone git@github.com:YYC-Cube/yyc3-rediops-api.git
cd yyc3-rediops-api

# 安装依赖
npm install

# 生成 .env 文件
node scripts/env-sync.js
cp .env.example .env
# 修改 .env 中的实际密码与密钥

# 初始化数据库
mysql -u root -p < schema/init.sql

# 启动服务
npm run dev

📮 服务入口
API 地址：https://api.0379.email

文档地址：https://api.0379.email/docs

管理邮箱：admin@0379.email

🧠 团队建议
每次部署前执行 scripts/backup.sh 备份数据库

每次结构变更更新 CHANGELOG.md

每次接口新增同步更新 swagger.yaml

本文档由Edge指导YYC³团队编制，所有部署均可追溯，每次上线皆有仪式感。
```
