const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET    /api/users       - Lấy danh sách users
// GET    /api/users/:id   - Lấy thông tin user theo ID
// POST   /api/users       - Tạo user mới
// PUT    /api/users/:id   - Cập nhật thông tin user
// DELETE /api/users/:id   - Xoá mềm user

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
