const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30,             // 每分钟最多30次请求
  message: {
    code: 1007,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});
