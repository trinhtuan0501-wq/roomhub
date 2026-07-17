const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    reason: {
      type: String,
      enum: ['wrong_info', 'wrong_price', 'inappropriate_images', 'scam', 'not_exist', 'spam', 'other'],
      required: [true, 'Lý do báo cáo là bắt buộc'],
    },
    description: {
      type: String,
      required: [true, 'Mô tả chi tiết báo cáo là bắt buộc'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'resolved'],
      default: 'pending',
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    handledAt: {
      type: Date,
    },
    handledNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
