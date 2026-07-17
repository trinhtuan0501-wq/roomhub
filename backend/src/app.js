const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Route imports
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const requestRoutes = require('./routes/requestRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. SECURITY MIDDLEWARES
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow local uploaded assets to be loaded by frontend
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

// 2. PARSE REQUEST BODIES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. SERVE STATIC FILES (UPLOADED IMAGES)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 4. API STATUS ROUTE
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'RoomHub API is running smoothly',
    timestamp: new Date(),
  });
});

// 5. BIND ROUTERS
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 6. 404 HANDLER
app.use((req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Không thể tìm thấy đường dẫn ${req.originalUrl} trên máy chủ này`,
  });
});

// 7. GLOBAL ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // Do not expose stack trace details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      status,
      message: err.isOperational ? err.message : 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.',
    });
  } else {
    res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }
});

module.exports = app;
