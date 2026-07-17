// Email regex check
const isEmail = (email) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

// Phone regex check
const isPhone = (phone) => {
  return /^[0-9]{9,11}$/.test(phone); // Vietnamese phone number check (9-11 digits)
};

exports.validateRegister = (req, res, next) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'Tất cả các trường thông tin đều là bắt buộc' });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Email không đúng định dạng' });
  }

  if (!isPhone(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải từ 9-11 số)' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Email không đúng định dạng' });
  }

  next();
};

exports.validateResetPassword = (req, res, next) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
  }

  next();
};

exports.validateRoom = (req, res, next) => {
  const { title, description, type, price, deposit, area, maxOccupants, address } = req.body;

  if (!title || !description || !type || price === undefined || deposit === undefined || !area || !maxOccupants || !address) {
    return res.status(400).json({ message: 'Thông tin phòng không được để trống' });
  }

  if (price <= 0) {
    return res.status(400).json({ message: 'Giá thuê hàng tháng phải lớn hơn 0' });
  }

  if (deposit < 0) {
    return res.status(400).json({ message: 'Tiền cọc không được nhỏ hơn 0' });
  }

  if (area <= 0) {
    return res.status(400).json({ message: 'Diện tích phòng phải lớn hơn 0' });
  }

  if (maxOccupants <= 0) {
    return res.status(400).json({ message: 'Số người ở tối đa phải lớn hơn 0' });
  }

  // Address check
  const { province, district, ward, detail } = address;
  if (!province || !district || !ward || !detail) {
    return res.status(400).json({ message: 'Địa chỉ chi tiết của phòng là bắt buộc' });
  }

  next();
};
