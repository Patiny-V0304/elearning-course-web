require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Cho phép server đọc dữ liệu JSON từ Frontend gửi lên

// Route test cơ bản
app.get('/', (req, res) => {
  res.json({ message: "Chào mừng đến với Backend E-learning API!" });
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy rầm rầm tại cổng ${PORT} 🚀`);
});