const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const sendEmail = require('../utils/email');

// Helper to hash token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// 1. REGISTER
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Validate role
    if (role && !['tenant', 'landlord'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò người dùng không hợp lệ' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Generate email verification token
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyToken = hashToken(rawVerifyToken);
    const emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = new User({
      fullName,
      email,
      phone,
      password,
      role: role || 'tenant',
      status: 'unverified',
      emailVerifyToken,
      emailVerifyExpires,
    });

    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:8081'}/verify-email?token=${rawVerifyToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Xác thực tài khoản RoomHub',
      text: `Xin chào ${user.fullName},\n\nVui lòng xác thực tài khoản RoomHub của bạn bằng cách click vào đường dẫn sau: ${verificationUrl}\n\nĐường dẫn này có hiệu lực trong vòng 24 giờ.`,
      html: `<h3>Xin chào ${user.fullName},</h3><p>Vui lòng click vào liên kết bên dưới để xác thực tài khoản RoomHub của bạn:</p><p><a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực ngay</a></p><p>Hoặc sao chép đường dẫn: ${verificationUrl}</p><p>Đường dẫn này có hiệu lực trong vòng 24 giờ.</p>`,
    });

    // Create Notification
    await Notification.create({
      recipient: user._id,
      type: 'auth',
      title: 'Đăng ký thành công',
      body: 'Chào mừng bạn đến với RoomHub! Vui lòng xác thực email của bạn.',
    });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token xác thực không được để trống' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    user.status = 'active';
    user.emailVerifiedAt = Date.now();
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    await Notification.create({
      recipient: user._id,
      type: 'auth',
      title: 'Xác thực email thành công',
      body: 'Tài khoản của bạn đã được xác thực thành công. Bạn có thể đăng tin và gửi yêu cầu thuê.',
    });

    res.status(200).json({ message: 'Xác thực email thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESEND VERIFICATION EMAIL
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với email này' });
    }

    if (user.status !== 'unverified') {
      return res.status(400).json({ message: 'Tài khoản này đã được xác thực hoặc đã bị khóa' });
    }

    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = hashToken(rawVerifyToken);
    user.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:8081'}/verify-email?token=${rawVerifyToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Xác thực tài khoản RoomHub (Gửi lại)',
      text: `Xin chào ${user.fullName},\n\nVui lòng xác thực tài khoản của bạn bằng cách click vào đường dẫn sau: ${verificationUrl}`,
      html: `<h3>Xin chào ${user.fullName},</h3><p>Vui lòng click vào liên kết bên dưới để xác thực tài khoản của bạn:</p><p><a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực ngay</a></p>`,
    });

    res.status(200).json({ message: 'Đã gửi lại email xác thực thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password, deviceName } = req.body;

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Security rule: Don't reveal if account exists
      return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(401).json({
        message: `Tài khoản đã bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.`,
      });
    }

    // Check if account is locked by admin
    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes lock
        await user.save();
        return res.status(401).json({
          message: 'Tài khoản của bạn đã bị khóa trong 30 phút vì nhập sai mật khẩu quá 5 lần',
        });
      }
      await user.save();
      return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác' });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user (session management)
    user.refreshTokens.push({
      token: refreshToken,
      device: deviceName || 'Unknown Web Device',
    });

    // Limit maximum sessions to 5 (FIFO)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }

    await user.save();

    res.status(200).json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token không được để trống' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Check if refresh token is in database
    const tokenIndex = user.refreshTokens.findIndex((t) => t.token === token);
    if (tokenIndex === -1) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Replace old refresh token with new one (token rotation)
    user.refreshTokens[tokenIndex] = {
      token: newRefreshToken,
      device: user.refreshTokens[tokenIndex].device,
      createdAt: Date.now(),
    };
    await user.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. LOGOUT
exports.logout = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token không được để trống' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      // If token expired, we just succeed to avoid block
      return res.status(200).json({ message: 'Đã đăng xuất (Token đã hết hạn)' });
    }

    const user = await User.findById(decoded.id);
    if (user) {
      // Remove refresh token
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
      await user.save();
    }

    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // For security, always show generic success response even if user not found
    const successMsg = 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.';

    if (!user) {
      return res.status(200).json({ message: successMsg });
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawResetToken);
    user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour expiration
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:8081'}/reset-password?token=${rawResetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu RoomHub',
      text: `Chào ${user.fullName},\n\nBạn nhận được thư này vì bạn đã yêu cầu đặt lại mật khẩu cho tài khoản RoomHub.\n\nVui lòng click vào liên kết sau để đặt lại mật khẩu: ${resetUrl}\n\nNếu bạn không yêu cầu điều này, xin vui lòng bỏ qua thư này.`,
      html: `<h3>Xin chào ${user.fullName},</h3><p>Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản RoomHub.</p><p><a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a></p><p>Hoặc sao chép đường dẫn: ${resetUrl}</p><p>Liên kết này có hiệu lực trong vòng 1 giờ.</p>`,
    });

    res.status(200).json({ message: successMsg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Security: invalidate all existing sessions
    user.refreshTokens = [];
    
    await user.save();

    await Notification.create({
      recipient: user._id,
      type: 'auth',
      title: 'Đổi mật khẩu thành công',
      body: 'Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại.',
    });

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. GET ME
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
