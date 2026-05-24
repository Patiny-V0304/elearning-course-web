const prisma = require('../lib/prisma');

// ==========================================
// QUẢN LÝ CHƯƠNG (SECTIONS)
// ==========================================

// [POST] Tạo Chương mới (Admin)
const createSection = async (req, res) => {
  try {
    const { courseId, title, orderIndex } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'courseId và title là bắt buộc.' });
    }

    const section = await prisma.section.create({
      data: {
        courseId: parseInt(courseId),
        title,
        orderIndex: parseInt(orderIndex) || 0,
      }
    });

    res.status(201).json({ message: 'Tạo chương thành công', section });
  } catch (error) {
    console.error('Lỗi tạo section:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo chương.' });
  }
};

// [PUT] Cập nhật Chương (Admin)
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, orderIndex } = req.body;

    const section = await prisma.section.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) })
      }
    });

    res.status(200).json({ message: 'Cập nhật chương thành công', section });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy chương' });
    res.status(500).json({ error: 'Lỗi server khi cập nhật chương.' });
  }
};

// [DELETE] Xóa mềm Chương (Admin)
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.section.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Chương đã được xóa mềm.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy chương' });
    res.status(500).json({ error: 'Lỗi server khi xóa chương.' });
  }
};

// ==========================================
// QUẢN LÝ BÀI HỌC (LESSONS)
// ==========================================

// [POST] Tạo Bài học mới (Admin)
const createLesson = async (req, res) => {
  try {
    const { 
      sectionId, title, contentType, contentUrl, 
      durationSeconds, isPreview, orderIndex 
    } = req.body;

    if (!sectionId || !title || !contentType) {
      return res.status(400).json({ error: 'sectionId, title và contentType là bắt buộc.' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: parseInt(sectionId),
        title,
        contentType, // "video", "text", "quiz"
        contentUrl,
        durationSeconds: parseInt(durationSeconds) || 0,
        isPreview: isPreview || false,
        orderIndex: parseInt(orderIndex) || 0,
      }
    });

    res.status(201).json({ message: 'Tạo bài học thành công', lesson });
  } catch (error) {
    console.error('Lỗi tạo lesson:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo bài học.' });
  }
};

// [PUT] Cập nhật Bài học (Admin)
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, contentType, contentUrl, 
      durationSeconds, isPreview, orderIndex 
    } = req.body;

    const lesson = await prisma.lesson.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(contentType && { contentType }),
        ...(contentUrl !== undefined && { contentUrl }),
        ...(durationSeconds !== undefined && { durationSeconds: parseInt(durationSeconds) }),
        ...(isPreview !== undefined && { isPreview }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) }),
      }
    });

    res.status(200).json({ message: 'Cập nhật bài học thành công', lesson });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy bài học' });
    res.status(500).json({ error: 'Lỗi server khi cập nhật bài học.' });
  }
};

// [DELETE] Xóa mềm Bài học (Admin)
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.lesson.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Bài học đã được xóa mềm.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy bài học' });
    res.status(500).json({ error: 'Lỗi server khi xóa bài học.' });
  }
};

module.exports = {
  createSection, updateSection, deleteSection,
  createLesson, updateLesson, deleteLesson
};