const Report = require('../models/Report');
const Room = require('../models/Room');

exports.createReport = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ message: 'Lý do và nội dung báo cáo là bắt buộc' });
    }

    const validReasons = ['wrong_info', 'wrong_price', 'inappropriate_images', 'scam', 'not_exist', 'spam', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ message: 'Lý do báo cáo không hợp lệ' });
    }

    const room = await Room.findById(roomId);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng bị báo cáo' });
    }

    const report = new Report({
      reporter: req.user.id,
      room: roomId,
      reason,
      description,
    });

    await report.save();

    res.status(201).json({
      message: 'Gửi báo cáo vi phạm thành công. Ban quản trị sẽ sớm xem xét.',
      report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
