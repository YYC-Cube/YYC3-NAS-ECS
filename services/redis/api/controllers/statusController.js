const redisService = require('../services/redis');

exports.getStatus = async (req, res) => {
  let redisStatus = 'unknown';
  try {
    const pong = await redisService.ping();
    redisStatus = pong === 'PONG' ? 'ok' : 'fail';
  } catch (e) {
    redisStatus = 'fail';
  }

  res.json({
    code: 0,
    message: 'success',
    data: {
      service: 'rediops.api',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      redis: redisStatus
    }
  });
};
