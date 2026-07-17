const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: {
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.',
  },
});

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;
