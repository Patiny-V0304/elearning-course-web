require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import routes
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server đang chạy' });
});

// Mount routes
app.use('/api/users', userRoutes);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Backend REST API đang chạy tại http://localhost:${PORT}`);
});
