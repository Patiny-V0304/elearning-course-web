const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');

// Import middleware xác thực token (Chỉ cần đăng nhập, không cần quyền admin)
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Lấy chi tiết nội dung bài học (Tên bài, văn bản, file đính kèm, checkpoint cũ)
router.get('/lessons/:id', verifyToken, learningController.getLessonDetail);

// 2. Cập nhật tiến độ liên tục (Frontend gọi tự động mỗi 10 giây khi xem video)
router.post('/lessons/:id/progress', verifyToken, learningController.updateProgress);

// 3. Đánh dấu hoàn thành bài học (Có kích hoạt hệ thống chống tua gian lận)
router.post('/lessons/:id/complete', verifyToken, learningController.completeLesson);

module.exports = router;