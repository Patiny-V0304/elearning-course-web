const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register   - Đăng ký tài khoản mới
router.post('/register', authController.register);

// POST /api/auth/login      - Đăng nhập (trả access token + set refresh cookie)
router.post('/login', authController.login);

// POST /api/auth/refresh    - Làm mới access token bằng refresh token cookie
router.post('/refresh', authController.refresh);

// POST /api/auth/logout     - Đăng xuất (xóa refresh token cookie)
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password  - Gửi email reset mật khẩu
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password   - Đặt lại mật khẩu bằng token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
