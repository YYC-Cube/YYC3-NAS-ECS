#!/bin/bash

# 🚀 一键启动 · RediOps API
# ✅ 自动安装依赖、初始化数据库、启动服务

echo "📦 安装依赖..."
npm install

echo "🔧 生成 .env 文件..."
node scripts/env-sync.js
cp .env.example .env

echo "🗄️ 初始化数据库..."
mysql -u root -p < schema/init.sql

echo "🚀 启动服务..."
npm run dev

echo "✅ 项目已启动：http://localhost:3000"
