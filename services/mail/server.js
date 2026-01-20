/**
 * @file Mail 服务入口
 * @description 邮件服务，提供基础 API 路由与健康探针
 * @module mail
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 * @updated 2025-11-02
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 6003;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.static(__dirname + '/html'));

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from mail.0379.email!' });
});

// 引入共享的状态接口模块（包含 healthcheck、status、version、metrics）
const statusRoutes = require('../shared/status');
app.use('/api', statusRoutes);

// 引入共享的文档模块，提供 Swagger 文档支持
const docsRoutes = require('../shared/docs');
app.get('/api/docs', (req, res) => {
  res.json(docsRoutes);
});

// 初始化Redis服务
const redisService = require('../shared/redis');

// 启动时初始化Redis（失败不阻塞API启动）
async function initializeServices() {
  try {
    const redisReady = await redisService.init();
    console.log(`Redis service initialized: ${redisReady ? 'Connected' : 'Not connected'}`);
  } catch (error) {
    console.error('Redis initialization error:', error);
  }
}

// 启动服务
app.listen(PORT, HOST, async () => {
  await initializeServices();
  console.log(`✅ Mail server running at http://${HOST}:${PORT}`);
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('接收到SIGTERM信号，准备关闭服务');
  
  // 断开Redis连接
  try {
    await redisService.disconnect();
    console.log('Redis connection closed');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
  
  setTimeout(() => {
    console.log('✅ Mail server gracefully stopped');
    process.exit(0);
  }, 500);
});