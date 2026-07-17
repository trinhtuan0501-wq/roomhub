const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rentalRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalRequest',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Điểm đánh giá là bắt buộc'],
      min: [1, 'Điểm đánh giá tối thiểu là 1'],
      max: [5, 'Điểm đánh giá tối đa là 5'],
    },
    comment: {
      type: String,
      required: [true, 'Nội dung nhận xét là bắt buộc'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews per rentalRequest
reviewSchema.index({ rentalRequest: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
