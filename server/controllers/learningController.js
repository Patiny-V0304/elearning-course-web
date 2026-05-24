const prisma = require('../lib/prisma');

// ==========================================
// 1. MỞ BÀI HỌC (Lấy nội dung & tài liệu đính kèm)
// ==========================================
const getLessonDetail = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.user.id;

    // Lấy thông tin bài học kèm theo Khóa học gốc và Tài liệu đính kèm
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: { select: { courseId: true } },
        attachments: true // Lấy các file đính kèm (PDF, ZIP,...)
      }
    });

    if (!lesson || lesson.deletedAt) {
      return res.status(404).json({ error: 'Bài học không tồn tại hoặc đã bị xóa.' });
    }

    // [BẢO MẬT] Kiểm tra quyền truy cập (Học thử hoặc Đã mua)
    if (!lesson.isPreview) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: lesson.section.courseId }
        }
      });

      if (!enrollment || enrollment.status !== 'active') {
        return res.status(403).json({ error: 'Bạn cần mua khóa học để xem nội dung bài học này.' });
      }
    }

    // Lấy tiến độ hiện tại của học viên để Frontend phát video tiếp tục
    const progress = await prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });

    // Trả về dữ liệu cho Frontend render giao diện
    res.status(200).json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        contentType: lesson.contentType,
        contentUrl: lesson.contentUrl, 
        durationSeconds: lesson.durationSeconds,
        attachments: lesson.attachments
      },
      progress: {
        lastCheckpointTime: progress?.lastCheckpointTime || 0,
        isCompleted: !!progress?.completedAt
      }
    });

  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài học:', error);
    res.status(500).json({ error: 'Lỗi server khi mở bài học.' });
  }
};

// ==========================================
// 2. CẬP NHẬT TIẾN ĐỘ (Frontend gọi ngầm mỗi 10 giây)
// ==========================================
const updateProgress = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const { current_time } = req.body; // Số giây hiện tại mà học viên đang xem
    const userId = req.user.id;

    // Upsert: Tạo mới nếu chưa có tiến độ, Cập nhật nếu đã có
    const progress = await prisma.lessonCompletion.upsert({
      where: {
        userId_lessonId: { userId, lessonId }
      },
      update: {
        lastCheckpointTime: Math.floor(current_time)
      },
      create: {
        userId,
        lessonId,
        lastCheckpointTime: Math.floor(current_time)
      }
    });

    res.status(200).json({ message: 'Đã lưu checkpoint', progress });
  } catch (error) {
    console.error('Lỗi cập nhật tiến độ:', error);
    res.status(500).json({ error: 'Lỗi server khi lưu tiến độ.' });
  }
};

// ==========================================
// 3. HOÀN THÀNH BÀI HỌC (Có kiểm tra chống gian lận)
// ==========================================
const completeLesson = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.user.id;

    // Lấy thông tin bài học
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { courseId: true } } }
    });

    if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài học' });

    // Kiểm tra quyền mua khóa học (Giống hệt bước mở bài học)
    if (!lesson.isPreview) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.section.courseId } }
      });
      if (!enrollment || enrollment.status !== 'active') {
        return res.status(403).json({ error: 'Bạn chưa mua hoặc đã hết hạn khóa học này.' });
      }
    }

    // Lấy tiến độ (checkpoint) hiện tại từ DB
    const progress = await prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });

    // --- LOGIC CHỐNG GIAN LẬN ---
    if (lesson.contentType === 'video') {
      const lastCheckpoint = progress?.lastCheckpointTime || 0;
      // Trừ hao 5 giây (Ví dụ video dài 60s, xem đến 55s là được cho qua)
      if (lastCheckpoint < lesson.durationSeconds - 5) {
        return res.status(400).json({ 
          error: `Hệ thống chống gian lận: Bạn mới xem đến giây thứ ${lastCheckpoint}, trong khi video dài ${lesson.durationSeconds} giây.` 
        });
      }
    } else if (lesson.contentType === 'quiz') {
       return res.status(400).json({ 
         error: 'Bài trắc nghiệm phải được hệ thống tự động chấm điểm, không thể bấm hoàn thành thủ công.' 
       });
    }
    // ----------------------------

    // Ghi nhận hoàn thành bài học
    const completion = await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completedAt: new Date() }, // Đánh dấu mốc thời gian hoàn thành
      create: { userId, lessonId, completedAt: new Date() }
    });

    res.status(200).json({ message: 'Chúc mừng bạn đã hoàn thành bài học!', completion });
  } catch (error) {
    console.error('Lỗi hoàn thành bài học:', error);
    res.status(500).json({ error: 'Lỗi server khi hoàn thành bài học.' });
  }
};

// Xuất các module để sử dụng trong Routes
module.exports = {
  getLessonDetail,
  updateProgress,
  completeLesson
};