const Review = require('../models/Review');
const RentalRequest = require('../models/RentalRequest');
const Room = require('../models/Room');

// 1. CREATE REVIEW
exports.createReview = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { rating, comment } = req.body;
    const tenantId = req.user.id;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Điểm đánh giá và bình luận là bắt buộc' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5 sao' });
    }

    // Rule: Check if user has a completed transaction (RentalRequest) for this room
    const rentalRequest = await RentalRequest.findOne({
      room: roomId,
      tenant: tenantId,
      status: 'completed',
    });

    if (!rentalRequest) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể đánh giá phòng này sau khi đã hoàn tất hợp đồng thuê/giao dịch thành công',
      });
    }

    // Rule: Check if already reviewed for this transaction
    const existingReview = await Review.findOne({ rentalRequest: rentalRequest._id });
    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã đánh giá giao dịch thuê phòng này rồi' });
    }

    const review = new Review({
      room: roomId,
      tenant: tenantId,
      rentalRequest: rentalRequest._id,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({
      message: 'Đăng đánh giá phòng thành công',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. GET ROOM REVIEWS
exports.getRoomReviews = async (req, res) => {
  try {
    const { roomId } = req.params;
    const reviews = await Review.find({ room: roomId })
      .populate('tenant', 'fullName avatar')
      .sort({ createdAt: -1 });

    // Aggregate rating statistics
    const stats = await Review.aggregate([
      { $match: { room: new Object(roomId) } },
      {
        $group: {
          _id: '$room',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingStats = stats.length > 0 ? stats[0] : { averageRating: 0, totalReviews: 0 };

    res.status(200).json({
      reviews,
      ratingStats: {
        averageRating: Math.round(ratingStats.averageRating * 10) / 10,
        totalReviews: ratingStats.totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. DELETE REVIEW (BY TENANT OR ADMIN)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Tenant who wrote it OR admin can delete
    if (review.tenant.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa đánh giá này' });
    }

    await Review.deleteOne({ _id: review._id });
    res.status(200).json({ message: 'Xóa đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
