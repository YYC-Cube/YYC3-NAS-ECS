module.exports = function (requiredRole) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ code: 1006, message: '权限不足' });
    }
    next();
  };
};
