/**
 * @file 共享状态接口模块
 * @description 提供healthcheck、status、version、metrics等通用端点
 * @module shared/status
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

const express = require('express');
const os = require('os');
const router = express.Router();

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.VERSION || '1.0.0',
    hostname: os.hostname(),
    uptime: process.uptime(),
  });
});

// 状态信息端点
router.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.VERSION || '1.0.0',
    hostname: os.hostname(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  });
});

// 版本信息端点
router.get('/version', (req, res) => {
  res.json({
    version: process.env.VERSION || '1.0.0',
    service: process.env.SERVICE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// 指标信息端点
router.get('/metrics', (req, res) => {
  res.json({
    service: process.env.SERVICE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
  });
});

module.exports = router;