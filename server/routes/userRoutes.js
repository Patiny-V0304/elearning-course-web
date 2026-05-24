const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.post('/login', userController.loginUser); // Thêm dòng này
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
// GET  /api/users/me  - Lấy thông tin user đang đăng nhập
router.get('/me', userController.getMe);

// PUT  /api/users/me  - Cập nhật profile (username, avatar, bio, đổi mật khẩu)
router.put('/me', userController.updateMe);


module.exports = router;
