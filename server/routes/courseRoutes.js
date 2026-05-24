const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Import các middleware bảo vệ
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// [Public] Mọi người đều có thể xem danh sách khóa học
router.get('/', courseController.getAllCourses);

// [Protected - Admin Only] Chỉ Admin mới được tạo khóa học
// Chuỗi middleware: Phải có Token hợp lệ -> Phải là Admin -> Mới được vào createCourse
router.post('/', verifyToken, verifyAdmin, courseController.createCourse);

module.exports = router;