const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');

// [GET] Lấy link stream video bảo mật (Signed URL)
const getVideoPlayback = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const userId = req.user.id;

    // 1. Tìm bài học
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { courseId: true } } }
    });

    if (!lesson || lesson.deletedAt || lesson.contentType !== 'video') {
      return res.status(404).json({ error: 'Video không tồn tại.' });
    }

    // 2. Kiểm tra quyền sở hữu (Đã mua khóa học chưa?)
    if (!lesson.isPreview) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.section.courseId } }
      });

      if (!enrollment || enrollment.status !== 'active') {
        return res.status(403).json({ error: 'Bạn chưa mua khóa học này.' });
      }
    }

    // 3. TẠO SIGNED URL BẢO MẬT (Chống tải lậu)
    // Trong DB, contentUrl lúc này chỉ lưu ID của video trên nền tảng (VD: Mux Video ID)
    const videoId = lesson.contentUrl; 

    if (!videoId) {
      return res.status(400).json({ error: 'Bài học này chưa được upload video.' });
    }

    // Mô phỏng tạo Token bảo mật có thời hạn 4 tiếng (Cách Mux/Cloudflare hoạt động)
    // Thực tế nếu bạn dùng Mux, bạn sẽ cài thư viện @mux/mux-node để generate token này
    const videoToken = jwt.sign(
      { 
        videoId: videoId, 
        userId: userId, 
        action: 'playback' 
      },
      process.env.VIDEO_SECRET_KEY || 'secret_video_key_123',
      { expiresIn: '4h' } // Sau 4 tiếng link sẽ tự chết
    );

    // 4. Trả về đường link HLS (chuẩn stream video) kèm theo Token
    // Frontend sẽ dùng link này bỏ vào Video Player
    const streamUrl = `https://stream.your-domain.com/${videoId}.m3u8?token=${videoToken}`;

    res.status(200).json({ 
      playbackUrl: streamUrl,
      duration: lesson.durationSeconds
    });

  } catch (error) {
    console.error('Lỗi khi tạo link video:', error);
    res.status(500).json({ error: 'Lỗi server khi load video.' });
  }
};

module.exports = { getVideoPlayback };