const prisma = require('../lib/prisma');

// [POST] Tạo khóa học mới (Yêu cầu quyền Admin)
const createCourse = async (req, res) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      level, // Ví dụ: "beginner", "intermediate", "advanced"
      price,
      discountPrice,
      thumbnailUrl,
      previewVideoUrl,
      status, // "draft" hoặc "published"
      categoryId,
    } = req.body;

    // Lấy ID của Admin từ Token đăng nhập
    const adminId = req.user.id;

    // Validate bắt buộc
    if (!title || !slug) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: title, slug' });
    }

    // Tiến hành tạo khóa học
    const newCourse = await prisma.course.create({
      data: {
        title,
        slug,
        shortDescription,
        fullDescription,
        level: level || "beginner",
        price: price ? parseFloat(price) : 0, // Prisma Decimal cần cast cho an toàn
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        thumbnailUrl,
        previewVideoUrl,
        status: status || "draft",
        categoryId: categoryId ? parseInt(categoryId) : null,
        createdBy: adminId, // Gắn ID của người đang tạo vào
      },
      // Select (trả về) các thông tin cần thiết sau khi tạo thành công
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        creator: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    res.status(201).json({ message: 'Tạo khóa học thành công', course: newCourse });
  } catch (error) {
    console.error('Lỗi khi tạo khóa học:', error);

    // Xử lý lỗi trùng lặp slug (unique constraint)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug (Đường dẫn) khóa học này đã tồn tại.' });
    }

    // Xử lý lỗi Category không tồn tại (nếu có categoryId)
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Danh mục (Category) không tồn tại.' });
    }

    res.status(500).json({ error: 'Lỗi server khi tạo khóa học.' });
  }
};

// [GET] Lấy danh sách khóa học (Public)
const getAllCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            // Chỉ lấy các khóa học đã publish nếu public
            where: { status: 'published', deletedAt: null },
            select: {
                id: true, title: true, slug: true, shortDescription: true,
                price: true, discountPrice: true, thumbnailUrl: true, level: true,
                creator: { select: { username: true } },
                category: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách khóa học' });
    }
}

// [GET] Lấy danh sách khóa học cho Admin (Tất cả trạng thái + Phân trang)
const getAdminCourses = async (req, res) => {
  try {
    const adminId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy tất cả khóa học do Admin này tạo (chưa bị xóa mềm)
    const courses = await prisma.course.findMany({
      where: { 
        createdBy: adminId,
        deletedAt: null 
      },
      skip: skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { name: true } },
        _count: { select: { sections: true, enrollments: true } } // Đếm số chương và số người mua
      }
    });

    // Đếm tổng số để làm phân trang trên Frontend
    const totalCourses = await prisma.course.count({
      where: { createdBy: adminId, deletedAt: null }
    });

    res.status(200).json({
      data: courses,
      pagination: {
        total: totalCourses,
        page: page,
        totalPages: Math.ceil(totalCourses / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách quản trị.' });
  }
};

// [GET] Lấy chi tiết khóa học theo Slug (Dành cho trang chi tiết Public & Admin)
const getCourseBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        creator: { select: { id: true, username: true, avatarUrl: true } },
        // Lấy kèm cây cấu trúc: Sections -> Lessons
        sections: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                contentType: true,
                durationSeconds: true,
                isPreview: true,
                orderIndex: true,
                // KHÔNG trả về contentUrl ở đây để bảo mật video. Chỉ trả khi gọi API xem bài học.
              }
            }
          }
        }
      }
    });

    // Nếu không tìm thấy hoặc đã bị xóa mềm
    if (!course || course.deletedAt) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết khóa học:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin khóa học.' });
  }
};

// [PUT] Cập nhật khóa học (Admin) - Có xử lý tăng Version
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Gồm các trường muốn update

  try {
    // 1. Kiểm tra khóa học có tồn tại không
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCourse || existingCourse.deletedAt) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học để cập nhật.' });
    }

    // 2. Xử lý Logic Versioning theo tài liệu V2.0
    // "Khi publish lại sau sửa đổi, tăng version"
    let newVersion = existingCourse.version;
    if (existingCourse.status === 'published') {
      newVersion += 1;
      // Optional (TASK-7.3 sau này): Bạn có thể insert vào bảng course_versions ở đây
    }

    // 3. Chuẩn bị dữ liệu cập nhật
    const dataToUpdate = {
      ...updateData,
      version: newVersion,
      // Chuyển đổi kiểu dữ liệu cho an toàn nếu có gửi lên
      ...(updateData.price !== undefined && { price: parseFloat(updateData.price) }),
      ...(updateData.discountPrice !== undefined && { discountPrice: parseFloat(updateData.discountPrice) }),
      ...(updateData.categoryId !== undefined && { categoryId: parseInt(updateData.categoryId) }),
    };

    // 4. Lưu vào Database
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    });

    res.status(200).json({ 
      message: 'Cập nhật khóa học thành công', 
      course: updatedCourse 
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật khóa học:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug khóa học đã tồn tại, vui lòng chọn slug khác.' });
    }
    res.status(500).json({ error: 'Lỗi server khi cập nhật khóa học.' });
  }
};

// [DELETE] Xóa mềm khóa học (Admin)
const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCourse || existingCourse.deletedAt) {
      return res.status(404).json({ error: 'Khóa học không tồn tại hoặc đã bị xóa.' });
    }

    // Cập nhật trường deletedAt thay vì xóa vĩnh viễn (Soft Delete)
    const deletedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: { 
        deletedAt: new Date(),
        status: 'archived' // Đổi trạng thái để không hiển thị ra ngoài nữa
      }
    });

    res.status(200).json({ 
      message: 'Khóa học đã được đưa vào thùng rác (Soft Delete).',
      courseId: deletedCourse.id
    });
  } catch (error) {
    console.error('Lỗi khi xóa khóa học:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa khóa học.' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseBySlug, 
  updateCourse,    
  deleteCourse    
};