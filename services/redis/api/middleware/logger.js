module.exports = async function (req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const log = {
      user_id: req.user?.id || null,
      endpoint: req.originalUrl,
      method: req.method,
      status_code: res.statusCode,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    };

    // 可接入数据库写入 api_logs 表
    // await logs.insert(log);

    console.log(`[LOG] ${log.method} ${log.endpoint} → ${log.status_code} (${Date.now() - start}ms)`);
  });

  next();
};
