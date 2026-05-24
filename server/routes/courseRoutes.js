const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Import các middleware bảo vệ
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// [Public] Mọi người đều có thể xem danh sách và chi tiết khóa học
router.get('/', courseController.getAllCourses);
router.get('/:slug', courseController.getCourseBySlug);

// [Protected - Admin Only] Endpoint quản lý của Admin
router.get('/admin/all', verifyToken, verifyAdmin, courseController.getAdminCourses);

// Các API quản lý CRUD khác của Admin
router.post('/', verifyToken, verifyAdmin, courseController.createCourse);
router.put('/:id', verifyToken, verifyAdmin, courseController.updateCourse);
router.delete('/:id', verifyToken, verifyAdmin, courseController.deleteCourse);

module.exports = router;