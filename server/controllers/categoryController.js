const prisma = require('../lib/prisma');

// [POST] Tạo danh mục mới (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parentId } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Tên danh mục và slug là bắt buộc.' });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId: parentId ? parseInt(parentId) : null,
      }
    });

    res.status(201).json({ message: 'Tạo danh mục thành công', category: newCategory });
  } catch (error) {
    console.error('Lỗi tạo danh mục:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug danh mục đã tồn tại.' });
    }
    res.status(500).json({ error: 'Lỗi server khi tạo danh mục.' });
  }
};

// [GET] Lấy danh sách danh mục (Cấu trúc cây: Cha -> Con) - Public
const getAllCategories = async (req, res) => {
  try {
    // Chỉ lấy các danh mục gốc (không có parentId) và kèm theo danh mục con của nó
    const categories = await prisma.category.findMany({
      where: { 
        parentId: null,
        deletedAt: null 
      },
      include: {
        children: {
          where: { deletedAt: null },
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error('Lỗi lấy danh sách danh mục:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách danh mục.' });
  }
};

// [PUT] Cập nhật danh mục (Admin)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, parentId } = req.body;

  try {
    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId: parentId ? parseInt(parentId) : null })
      }
    });

    res.status(200).json({ message: 'Cập nhật thành công', category: updatedCategory });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Slug đã tồn tại' });
    res.status(500).json({ error: 'Lỗi server khi cập nhật danh mục' });
  }
};

// [DELETE] Xóa mềm danh mục (Admin)
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Danh mục đã được xóa mềm.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.status(500).json({ error: 'Lỗi server khi xóa danh mục' });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};