const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// [Public] Lấy danh sách danh mục
router.get('/', categoryController.getAllCategories);

// [Admin] Thêm, sửa, xóa danh mục
router.post('/', verifyToken, verifyAdmin, categoryController.createCategory);
router.put('/:id', verifyToken, verifyAdmin, categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, categoryController.deleteCategory);

module.exports = router;