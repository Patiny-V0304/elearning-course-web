const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Tất cả routes admin đều yêu cầu đăng nhập + quyền admin
router.use(authenticate);
router.use(requireAdmin);

// GET  /api/admin/users              - Danh sách users (phân trang, tìm kiếm, lọc)
router.get('/users', userController.adminGetAllUsers);

// PUT  /api/admin/users/:id/status   - Khóa/Mở khóa tài khoản user
router.put('/users/:id/status', userController.adminUpdateUserStatus);

module.exports = router;
