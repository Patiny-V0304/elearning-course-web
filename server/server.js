require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initEmailTransporter } = require('./lib/email');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseContentRoutes = require('./routes/courseContentRoutes');
const videoRoutes = require('./routes/videoRoutes');
const learningRoutes = require('./routes/learningRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server đang chạy' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/content', courseContentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/learning', learningRoutes);



// Khởi động server
app.listen(PORT, async () => {
  console.log(`Backend REST API đang chạy tại http://localhost:${PORT}`);
});
  try {
    await initEmailTransporter();
  } catch (error) {
    console.error('Lỗi khi khởi tạo email service:', error);
  };

