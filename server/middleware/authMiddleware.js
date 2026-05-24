const jwt = require('jsonwebtoken');

// Middleware xác thực User (Kiểm tra xem đã đăng nhập chưa)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Từ chối truy cập: Vui lòng đăng nhập!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Giải mã token. Nếu token hết hạn hoặc sai bí mật, nó sẽ ném ra lỗi
    // Nhớ cấu hình JWT_SECRET trong file .env của server
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_elearning');
    req.user = decoded; // { id, email, role } (Ví dụ)
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// Middleware kiểm tra quyền Admin
// PHẢI chạy sau verifyToken
const verifyAdmin = (req, res, next) => {
  // Lấy role từ thông tin user đã được giải mã ở bước verifyToken
  const role = req.user?.role;

  // Đối chiếu với schema: role của Admin mặc định có thể là "admin"
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Chỉ Quản trị viên (Admin) mới có quyền thực hiện hành động này!' });
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
};