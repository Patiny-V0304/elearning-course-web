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

module.exports = {
  createCourse,
  getAllCourses
};