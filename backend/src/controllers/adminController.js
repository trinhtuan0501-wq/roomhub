const User = require('../models/User');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Amenity = require('../models/Amenity');
const RentalRequest = require('../models/RentalRequest');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Helper to log admin actions
const logActivity = async (userId, action, target, targetId, metadata) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      target,
      targetId,
      metadata,
    });
  } catch (err) {
    console.error('Error logging activity:', err.message);
  }
};

// 1. MANAGE USERS: GET ALL
exports.getUsers = async (req, res) => {
  try {
    const { q, role, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (q) {
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      users,
      pagination: { page: pageNum, limit: limitNum, total, pages },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. MANAGE USERS: LOCK/UNLOCK USER
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'locked', 'disabled'

    if (!['active', 'locked', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái tài khoản không hợp lệ' });
    }

    // Rule: Admin cannot lock themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản của chính mình' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Log Activity
    await logActivity(req.user.id, status === 'locked' ? 'LOCK_USER' : 'UNLOCK_USER', 'User', user._id, {
      oldStatus,
      newStatus: status,
    });

    // Notify User
    await Notification.create({
      recipient: user._id,
      type: 'account_status',
      title: status === 'locked' ? 'Tài khoản đã bị khóa' : 'Tài khoản đã được mở khóa',
      body: status === 'locked' 
        ? 'Tài khoản của bạn đã bị khóa bởi quản trị viên do vi phạm quy định.' 
        : 'Tài khoản của bạn đã hoạt động trở lại.',
    });

    res.status(200).json({
      message: `Đã cập nhật trạng thái tài khoản thành: ${status}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. MANAGE USERS: CHANGE ROLE
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'tenant', 'landlord', 'admin'

    if (!['tenant', 'landlord', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò người dùng không hợp lệ' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự thay đổi vai trò của chính mình' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logActivity(req.user.id, 'CHANGE_ROLE', 'User', user._id, { oldRole, newRole: role });

    res.status(200).json({ message: 'Thay đổi vai trò người dùng thành công', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. MODERATE ROOMS: GET ALL ROOMS (Approved, Pending, Rejected, Draft)
exports.getRooms = async (req, res) => {
  try {
    const { q, moderationStatus, status, page = 1, limit = 10 } = req.query;
    const query = { status: { $ne: 'deleted' } };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { 'address.detail': { $regex: q, $options: 'i' } },
      ];
    }

    if (moderationStatus) query.moderationStatus = moderationStatus;
    if (status) query.status = status;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const rooms = await Room.find(query)
      .populate('type')
      .populate('landlord', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Room.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      rooms,
      pagination: { page: pageNum, limit: limitNum, total, pages },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. MODERATE ROOMS: APPROVE
exports.approveRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng phòng' });
    }

    room.moderationStatus = 'approved';
    room.moderatedBy = req.user.id;
    room.moderatedAt = Date.now();
    room.moderationNote = '';
    await room.save();

    await logActivity(req.user.id, 'APPROVE_ROOM', 'Room', room._id, { title: room.title });

    // Notify landlord
    await Notification.create({
      recipient: room.landlord,
      type: 'room_approved',
      title: 'Bài đăng phòng đã được duyệt',
      body: `Bài đăng phòng "${room.title}" của bạn đã được phê duyệt và đang công khai hiển thị.`,
      relatedId: room._id,
      relatedModel: 'Room',
    });

    res.status(200).json({ message: 'Duyệt bài đăng phòng thành công', room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. MODERATE ROOMS: REJECT
exports.rejectRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Lý do từ chối phê duyệt là bắt buộc' });
    }

    const room = await Room.findById(id);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng phòng' });
    }

    room.moderationStatus = 'rejected';
    room.moderationNote = reason;
    room.moderatedBy = req.user.id;
    room.moderatedAt = Date.now();
    await room.save();

    await logActivity(req.user.id, 'REJECT_ROOM', 'Room', room._id, { title: room.title, reason });

    // Notify landlord
    await Notification.create({
      recipient: room.landlord,
      type: 'room_rejected',
      title: 'Bài đăng phòng bị từ chối',
      body: `Bài đăng phòng "${room.title}" của bạn bị từ chối phê duyệt. Lý do: ${reason}. Vui lòng sửa và gửi duyệt lại.`,
      relatedId: room._id,
      relatedModel: 'Room',
    });

    res.status(200).json({ message: 'Từ chối duyệt bài đăng phòng thành công', room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORCE HIDE / RESTORE ROOM (ADMIN OVERRIDE)
exports.toggleRoomVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng phòng' });
    }

    const newStatus = room.status === 'hidden' ? 'available' : 'hidden';
    room.status = newStatus;
    await room.save();

    await logActivity(req.user.id, newStatus === 'hidden' ? 'HIDE_ROOM' : 'UNHIDE_ROOM', 'Room', room._id, {
      title: room.title,
    });

    // Notify landlord
    await Notification.create({
      recipient: room.landlord,
      type: 'room_status',
      title: newStatus === 'hidden' ? 'Bài đăng bị ẩn bởi quản trị viên' : 'Bài đăng đã được phục hồi',
      body: newStatus === 'hidden'
        ? `Bài đăng phòng "${room.title}" đã bị ẩn khỏi hệ thống bởi quản trị viên.`
        : `Bài đăng phòng "${room.title}" đã được hiển thị trở lại.`,
      relatedId: room._id,
      relatedModel: 'Room',
    });

    res.status(200).json({ message: `Đã chuyển đổi trạng thái phòng thành: ${newStatus}`, room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. GET REPORTS
exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const reports = await Report.find(query)
      .populate('reporter', 'fullName email')
      .populate({
        path: 'room',
        populate: { path: 'landlord', select: 'fullName email phone' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Report.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      reports,
      pagination: { page: pageNum, limit: limitNum, total, pages },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. RESOLVE REPORT
exports.handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, handledNote } = req.body; // 'processing', 'resolved'

    if (!['processing', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái xử lý không hợp lệ' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    report.status = status;
    report.handledBy = req.user.id;
    report.handledAt = Date.now();
    if (handledNote) report.handledNote = handledNote;
    await report.save();

    await logActivity(req.user.id, 'RESOLVE_REPORT', 'Report', report._id, { status, handledNote });

    res.status(200).json({ message: 'Đã cập nhật trạng thái xử lý báo cáo thành công', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. ROOM TYPES CRUD
exports.createRoomType = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên loại phòng là bắt buộc' });

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const type = new RoomType({ name, slug, icon, description });
    await type.save();

    await logActivity(req.user.id, 'CREATE_ROOM_TYPE', 'RoomType', type._id, { name });

    res.status(201).json({ message: 'Tạo loại phòng mới thành công', type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoomTypes = async (req, res) => {
  try {
    const types = await RoomType.find({});
    res.status(200).json({ types });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRoomType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, isActive } = req.body;

    const type = await RoomType.findById(id);
    if (!type) return res.status(404).json({ message: 'Không tìm thấy loại phòng' });

    if (name) {
      type.name = name;
      type.slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    if (icon !== undefined) type.icon = icon;
    if (description !== undefined) type.description = description;
    if (isActive !== undefined) type.isActive = isActive;

    await type.save();

    await logActivity(req.user.id, 'UPDATE_ROOM_TYPE', 'RoomType', type._id, { name: type.name });

    res.status(200).json({ message: 'Cập nhật loại phòng thành công', type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. AMENITIES CRUD
exports.createAmenity = async (req, res) => {
  try {
    const { name, icon, category } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên tiện ích là bắt buộc' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const amenity = new Amenity({ name, slug, icon, category });
    await amenity.save();

    await logActivity(req.user.id, 'CREATE_AMENITY', 'Amenity', amenity._id, { name });

    res.status(201).json({ message: 'Tạo tiện ích mới thành công', amenity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find({});
    res.status(200).json({ amenities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, category, isActive } = req.body;

    const amenity = await Amenity.findById(id);
    if (!amenity) return res.status(404).json({ message: 'Không tìm thấy tiện ích' });

    if (name) {
      amenity.name = name;
      amenity.slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    if (icon !== undefined) amenity.icon = icon;
    if (category !== undefined) amenity.category = category;
    if (isActive !== undefined) amenity.isActive = isActive;

    await amenity.save();

    await logActivity(req.user.id, 'UPDATE_AMENITY', 'Amenity', amenity._id, { name: amenity.name });

    res.status(200).json({ message: 'Cập nhật tiện ích thành công', amenity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 11. ADMIN SYSTEM STATS DASHBOARD
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalLandlords = await User.countDocuments({ role: 'landlord' });
    const totalTenants = await User.countDocuments({ role: 'tenant' });
    const lockedAccounts = await User.countDocuments({ status: 'locked' });

    const totalRooms = await Room.countDocuments({ status: { $ne: 'deleted' } });
    const availableRooms = await Room.countDocuments({ status: 'available', moderationStatus: 'approved' });
    const pendingApprovalRooms = await Room.countDocuments({ moderationStatus: 'pending' });

    const totalRequests = await RentalRequest.countDocuments({});
    const completedRequests = await RentalRequest.countDocuments({ status: 'completed' });
    
    const unhandledReports = await Report.countDocuments({ status: 'pending' });

    // Recent Admin activity logs
    const recentActivities = await ActivityLog.find({})
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      stats: {
        totalUsers,
        totalLandlords,
        totalTenants,
        lockedAccounts,
        totalRooms,
        availableRooms,
        pendingApprovalRooms,
        totalRequests,
        completedRequests,
        unhandledReports,
      },
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 12. GET ACTIVITY LOGS
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({})
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(100); // return last 100 entries

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
