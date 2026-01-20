const express = require('express');
const app = express();
const rateLimit = require('./middleware/rateLimit');

app.use(rateLimit); // 所有路由统一限流
