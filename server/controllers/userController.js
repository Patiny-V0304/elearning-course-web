const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

const SALT_ROUNDS = 12;

// ============================================
// GET /users/me — Lấy thông tin user đang đăng nhập
// ============================================
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        bio: true,
        emailVerifiedAt: true,
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
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// PUT /users/me — Cập nhật profile của user đang đăng nhập
// ============================================
const updateMe = async (req, res) => {
  const { username, avatarUrl, bio, currentPassword, newPassword } = req.body;

  try {
    const updateData = {};

    // Cập nhật thông tin cơ bản
    if (username !== undefined) updateData.username = username;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;

    // Đổi mật khẩu (nếu có)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: 'Phải nhập mật khẩu hiện tại để đổi mật khẩu',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        });
      }

      // Lấy password hash hiện tại
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true },
      });

      const isValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    // Kiểm tra có gì để update không
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
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

    res.status(200).json({
      message: 'Cập nhật thành công',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật user:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username đã tồn tại' });
    }

    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// GET /admin/users — Lấy danh sách users (Admin)
// ============================================
const adminGetAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
    const where = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      users,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách users:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// PUT /admin/users/:id/status — Khóa/Mở khóa user (Admin)
// ============================================
const adminUpdateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      error: 'Trường isActive phải là boolean (true/false)',
    });
  }

  // Không cho admin tự khóa chính mình
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      error: 'Không thể thay đổi trạng thái tài khoản của chính mình',
    });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    res.status(200).json({
      message: isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái user:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  getMe,
  updateMe,
  adminGetAllUsers,
  adminUpdateUserStatus,
};

// Đăng nhập và nhận Token
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Tìm user theo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    // 2. Kiểm tra mật khẩu 
    // (Lưu ý: Vì API createUser của bạn đang nhận thẳng passwordHash từ body, 
    // nên ở đây mình tạm so sánh chuỗi trực tiếp. Trong thực tế bạn nên dùng bcrypt để mã hoá nhé).
    if (password !== user.passwordHash) {
      return res.status(401).json({ error: 'Sai mật khẩu.' });
    }

    // 3. Tạo Token (Kẹp thông tin id, email và role vào token)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // Payload
      process.env.JWT_SECRET || 'super_secret_key_elearning', // Secret Key
      { expiresIn: '1d' } // Hết hạn sau 1 ngày
    );

    // 4. Trả về token cho client
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập.' });
  }
};

// Đừng quên export nó ở cuối file nhé:
module.exports = {
  getAllUsers, getUserById, createUser, updateUser, deleteUser,
  loginUser // Thêm cái này
};