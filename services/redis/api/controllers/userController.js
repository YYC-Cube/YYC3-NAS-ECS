const users = require('../models/users');

exports.update = async (req, res) => {
  const { name } = req.body;

  try {
    await users.updateById(req.user.id, { name });

    const updated = await users.findById(req.user.id);
    res.json({
      code: 0,
      message: '修改成功',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ code: 1005, message: '服务异常', error: err.message });
  }
};
