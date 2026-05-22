const prisma = require('../lib/prisma');

// Lấy danh sách tất cả Users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách users:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách users' });
  }
};

// Lấy thông tin User theo ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin user:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin user' });
  }
};

// Tạo User mới
const createUser = async (req, res) => {
  const { email, username, passwordHash } = req.body;

  // Validate input
  if (!email || !username || !passwordHash) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc: email, username, passwordHash',
    });
  }

  try {
    const newUser = await prisma.user.create({
      data: { email, username, passwordHash },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Lỗi khi tạo user:', error);

    // Xử lý lỗi unique constraint (email hoặc username đã tồn tại)
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email hoặc username đã tồn tại',
      });
    }

    res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
};

// Cập nhật thông tin User
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, username, avatarUrl, bio } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(email && { email }),
        ...(username && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        bio: true,
        updatedAt: true,
      },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Lỗi khi cập nhật user:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email hoặc username đã tồn tại',
      });
    }

    res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
};

// Xoá mềm User (soft delete)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
      select: { id: true, email: true, deletedAt: true },
    });
    res.status(200).json({
      message: 'User đã được xoá mềm',
      user: deletedUser,
    });
  } catch (error) {
    console.error('Lỗi khi xoá user:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    res.status(500).json({ error: 'Lỗi server khi xoá user' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
