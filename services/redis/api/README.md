# YYC3 Rdeis API

> 💾 YYC3 AI Family 专业Redis缓存服务管理API
> 言传千行代码，语枢万物智能

![API Status](https://img.shields.io/badge/yyc3.redis.api-green?style=flat-square)
![Version](https://img.shields.io/badge/version-v2.0.0-blue?style=flat-square)
![Team](https://img.shields.io/badge/team-YYC3_AI_Family-ff69b4?style=flat-square)

## 仓库地址

- API 仓库：`git@github.com:YYC-Cube/yyc3-rediops-api.git`

## 项目介绍

这是 YYC3 AI Family 的 Redis 缓存服务管理 API，提供完整的 Redis 操作接口、监控功能和管理工具。

## 结构简述

- index.js 应用入口
- routes/status.js 状态检查路由
- controllers/statusController.js 控制器
- validators/statusValidator.js 校验器
- config.js 基础配置
- .env.example 环境变量模板
- README.md 项目说明

## 启动项目

1. 复制环境变量：cp .env.example .env
2. 安装依赖：npm install
3. 启动：npm run dev

## 📚 响应结构

{
"code": 0,
"message": "success",
"data": {
"service": "rediops.api",
"status": "operational",
"version": "1.0.0",
"timestamp": "...",
"serverTime": "..."
}
}

## TEAM_ADMIN_EMAIL

这是团队管理员的邮箱，用于登录和管理应用。默认值为

`admin@0379.email`
