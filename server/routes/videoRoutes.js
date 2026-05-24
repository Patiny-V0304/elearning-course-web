const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Frontend gọi API này để lấy link stream video (Bắt buộc phải đăng nhập)
router.get('/:lessonId/playback', verifyToken, videoController.getVideoPlayback);

module.exports = router;