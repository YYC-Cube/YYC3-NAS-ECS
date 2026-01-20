const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// 登录接口限流：每分钟最多 5 次
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    code: 1008,
    message: '登录请求过于频繁，请稍后再试'
  }
});

router.post('/login', loginLimiter, loginHandler);
