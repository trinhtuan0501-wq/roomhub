const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để truy cập tài nguyên này' });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản liên kết với token này không còn tồn tại' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bạn không có quyền thực hiện hành động này',
      });
    }
    next();
  };
};

exports.isVerified = (req, res, next) => {
  if (req.user.status === 'unverified') {
    return res.status(403).json({
      message: 'Bạn cần xác thực email trước khi thực hiện hành động này',
    });
  }
  next();
};
