const Favorite = require('../models/Favorite');
const Room = require('../models/Room');

exports.toggleFavorite = async (req, res) => {
  try {
    const { roomId } = req.params;
    const tenantId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng cho thuê' });
    }

    const existingFavorite = await Favorite.findOne({ tenant: tenantId, room: roomId });

    if (existingFavorite) {
      // Remove favorite
      await Favorite.deleteOne({ _id: existingFavorite._id });
      
      // Decrement favoriteCount in Room
      room.favoriteCount = Math.max(0, room.favoriteCount - 1);
      await room.save();

      return res.status(200).json({
        message: 'Đã xóa khỏi danh sách yêu thích',
        isFavorite: false,
        favoriteCount: room.favoriteCount,
      });
    } else {
      // Add favorite
      const favorite = new Favorite({ tenant: tenantId, room: roomId });
      await favorite.save();

      // Increment favoriteCount in Room
      room.favoriteCount += 1;
      await room.save();

      return res.status(200).json({
        message: 'Đã thêm vào danh sách yêu thích',
        isFavorite: true,
        favoriteCount: room.favoriteCount,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ tenant: req.user.id })
      .populate({
        path: 'room',
        populate: { path: 'type' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
