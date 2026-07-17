const RentalRequest = require('../models/RentalRequest');
const Room = require('../models/Room');
const Notification = require('../models/Notification');

// 1. TENANT: SEND RENTAL REQUEST
exports.createRequest = async (req, res) => {
  try {
    const { room: roomId, message, viewingDate } = req.body;

    if (!roomId || !viewingDate) {
      return res.status(400).json({ message: 'Thông tin phòng và ngày xem dự kiến là bắt buộc' });
    }

    const viewingDateTime = new Date(viewingDate);
    if (viewingDateTime <= new Date()) {
      return res.status(400).json({ message: 'Lịch xem phòng phải lớn hơn thời gian hiện tại' });
    }

    const room = await Room.findById(roomId);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng cho thuê' });
    }

    if (room.status === 'rented') {
      return res.status(400).json({ message: 'Phòng này đã được cho thuê' });
    }

    if (room.status === 'hidden') {
      return res.status(400).json({ message: 'Bài viết cho thuê phòng này đã bị ẩn' });
    }

    // Rule: Cannot request one's own room
    if (room.landlord.toString() === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể gửi yêu cầu thuê phòng của chính mình' });
    }

    // Rule: Check for existing pending request
    const existingRequest = await RentalRequest.findOne({
      room: roomId,
      tenant: req.user.id,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'Bạn đã gửi một yêu cầu đang chờ xử lý cho phòng này rồi',
      });
    }

    const request = new RentalRequest({
      room: roomId,
      tenant: req.user.id,
      landlord: room.landlord,
      message,
      viewingDate: viewingDateTime,
    });

    await request.save();

    // Create Notification for Landlord
    await Notification.create({
      recipient: room.landlord,
      type: 'new_request',
      title: 'Yêu cầu thuê phòng mới',
      body: `Người dùng ${req.user.fullName} đã gửi yêu cầu xem/thuê phòng "${room.title}".`,
      relatedId: request._id,
      relatedModel: 'RentalRequest',
    });

    res.status(201).json({
      message: 'Gửi yêu cầu thuê phòng thành công. Hãy đợi phản hồi từ chủ phòng.',
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. TENANT: GET MY REQUESTS
exports.getTenantRequests = async (req, res) => {
  try {
    const requests = await RentalRequest.find({ tenant: req.user.id })
      .populate('room')
      .populate('landlord', 'fullName phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. TENANT: CANCEL REQUEST
exports.cancelRequest = async (req, res) => {
  try {
    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thuê phòng' });
    }

    if (request.tenant.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy yêu cầu này' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Chỉ có thể hủy yêu cầu đang ở trạng thái chờ xử lý',
      });
    }

    request.status = 'cancelled';
    await request.save();

    // Notify landlord
    const room = await Room.findById(request.room);
    await Notification.create({
      recipient: request.landlord,
      type: 'request_cancelled',
      title: 'Yêu cầu thuê đã bị hủy',
      body: `Người thuê đã hủy yêu cầu xem phòng "${room ? room.title : 'Phòng'}"`,
      relatedId: request._id,
      relatedModel: 'RentalRequest',
    });

    res.status(200).json({ message: 'Hủy yêu cầu thuê phòng thành công', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. LANDLORD: GET RECEIVED REQUESTS
exports.getLandlordRequests = async (req, res) => {
  try {
    const requests = await RentalRequest.find({ landlord: req.user.id })
      .populate('room')
      .populate('tenant', 'fullName phone email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. LANDLORD: ACCEPT REQUEST
exports.acceptRequest = async (req, res) => {
  try {
    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }

    if (request.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý từ trước' });
    }

    request.status = 'accepted';
    if (req.body.landlordNote) {
      request.landlordNote = req.body.landlordNote;
    }
    await request.save();

    // Notify tenant
    const room = await Room.findById(request.room);
    await Notification.create({
      recipient: request.tenant,
      type: 'request_accepted',
      title: 'Yêu cầu thuê được chấp nhận',
      body: `Chủ phòng đã chấp nhận yêu cầu của bạn cho phòng "${room ? room.title : 'Phòng'}". Hãy liên hệ để xem phòng.`,
      relatedId: request._id,
      relatedModel: 'RentalRequest',
    });

    res.status(200).json({ message: 'Đã chấp nhận yêu cầu thuê', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. LANDLORD: REJECT REQUEST
exports.rejectRequest = async (req, res) => {
  try {
    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }

    if (request.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý từ trước' });
    }

    request.status = 'rejected';
    request.landlordNote = req.body.landlordNote || 'Từ chối yêu cầu';
    await request.save();

    // Notify tenant
    const room = await Room.findById(request.room);
    await Notification.create({
      recipient: request.tenant,
      type: 'request_rejected',
      title: 'Yêu cầu thuê bị từ chối',
      body: `Yêu cầu của bạn cho phòng "${room ? room.title : 'Phòng'}" đã bị từ chối. Lý do: ${request.landlordNote}`,
      relatedId: request._id,
      relatedModel: 'RentalRequest',
    });

    res.status(200).json({ message: 'Đã từ chối yêu cầu thuê', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. LANDLORD: COMPLETE REQUEST (RENTED SUCCESS)
exports.completeRequest = async (req, res) => {
  try {
    const request = await RentalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }

    if (request.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Yêu cầu phải được chấp nhận trước khi hoàn thành' });
    }

    request.status = 'completed';
    await request.save();

    // Update Room status to Rented
    const room = await Room.findById(request.room);
    if (room) {
      room.status = 'rented';
      await room.save();
    }

    // Notify tenant
    await Notification.create({
      recipient: request.tenant,
      type: 'request_completed',
      title: 'Thuê phòng thành công',
      body: `Chúc mừng! Giao dịch thuê phòng "${room ? room.title : 'Phòng'}" của bạn đã hoàn thành. Bạn có thể đánh giá phòng này bây giờ.`,
      relatedId: request._id,
      relatedModel: 'RentalRequest',
    });

    res.status(200).json({ message: 'Hoàn thành giao dịch thuê phòng', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
