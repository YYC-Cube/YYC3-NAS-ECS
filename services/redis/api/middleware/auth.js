const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ code: 1002, message: '未提供 token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 注入用户信息
    next();
  } catch (err) {
    return res.status(403).json({ code: 1003, message: 'token 无效或已过期' });
  }
};
