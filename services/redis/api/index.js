require('dotenv').config();
const express = require('express');
const app = express();
const statusRouter = require('./routes/status');
const redisService = require('./services/redis');

// 初始化 Redis（失败不阻塞 API 启动，但会在健康接口反映）
redisService.init()
  .then(() => console.log('[Redis] connected'))
  .catch((err) => console.warn('[Redis] not connected:', err.message));

app.use(express.json());
app.use('/status', statusRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
