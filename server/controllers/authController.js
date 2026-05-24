const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/email');

const SALT_ROUNDS = 12;

// ============================================
// POST /auth/register
// ============================================
const register = async (req, res) => {
  const { email, username, password } = req.body;

  // Validate input
  if (!email || !username || !password) {
    return res.status(400).json({
      error: 'Thiếu thông tin bắt buộc: email, username, password',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Mật khẩu phải có ít nhất 6 ký tự',
    });
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Tạo user
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Tạo tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set refresh token vào HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email hoặc username đã tồn tại',
      });
    }

    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

// ============================================
// POST /auth/login
// ============================================
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Thiếu email hoặc password',
    });
  }

  try {
    // Tìm user theo email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        passwordHash: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // So sánh password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set refresh token vào HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};

// ============================================
// POST /auth/refresh
// ============================================
const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Không tìm thấy refresh token' });
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Kiểm tra user vẫn tồn tại và active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({ error: 'Tài khoản không hợp lệ' });
    }

    // Tạo cặp token mới (rotate refresh token)
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Lỗi refresh token:', error);
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
};

// ============================================
// POST /auth/logout
// ============================================
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.status(200).json({ message: 'Đăng xuất thành công' });
};

// ============================================
// POST /auth/forgot-password
// ============================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Vui lòng nhập email' });
  }

  try {
    // Tìm user (không tiết lộ user có tồn tại hay không)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true, deletedAt: true },
    });

    // Luôn trả response giống nhau để tránh enumeration attack
    if (!user || user.deletedAt || !user.isActive) {
      return res.status(200).json({
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu',
      });
    }

    // Xóa các token cũ chưa dùng
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Tạo token mới (random 32 bytes → hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Lưu hashed token vào DB (hết hạn sau 1 giờ)
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 giờ
      },
    });

    // Gửi email chứa token gốc (không phải hashed)
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu',
    });
  } catch (error) {
    console.error('Lỗi forgot password:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// POST /auth/reset-password
// ============================================
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Thiếu token hoặc mật khẩu mới' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  try {
    // Hash token gửi lên để so sánh với DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Tìm token trong DB
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Token không hợp lệ' });
    }

    // Kiểm tra hết hạn
    if (resetRecord.expiresAt < new Date()) {
      // Xóa token hết hạn
      await prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      });
      return res.status(400).json({ error: 'Token đã hết hạn, vui lòng yêu cầu lại' });
    }

    // Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Cập nhật mật khẩu + xóa tất cả reset token của user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi reset password:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
