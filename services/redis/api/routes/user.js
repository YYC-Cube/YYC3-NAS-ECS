const express = require('express');
const router = express.Router();
const { login, register, info, update } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/info', auth, info);
router.put('/update', auth, update); // 需要鉴权

module.exports = router;
