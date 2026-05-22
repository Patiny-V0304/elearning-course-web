const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// GET  /api/users/me  - Lấy thông tin user đang đăng nhập
router.get('/me', userController.getMe);

// PUT  /api/users/me  - Cập nhật profile (username, avatar, bio, đổi mật khẩu)
router.put('/me', userController.updateMe);

module.exports = router;
