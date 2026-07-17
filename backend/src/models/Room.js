const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề bài đăng là bắt buộc'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả phòng là bắt buộc'],
    },
    rules: {
      type: String,
      default: '',
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Loại phòng là bắt buộc'],
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Chủ phòng là bắt buộc'],
    },
    price: {
      type: Number,
      required: [true, 'Giá thuê hàng tháng là bắt buộc'],
      min: [0, 'Giá thuê không thể nhỏ hơn 0'],
    },
    deposit: {
      type: Number,
      required: [true, 'Tiền cọc là bắt buộc'],
      min: [0, 'Tiền cọc không thể nhỏ hơn 0'],
    },
    electricityFee: {
      type: Number,
      default: 0,
    },
    waterFee: {
      type: Number,
      default: 0,
    },
    internetFee: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    area: {
      type: Number,
      required: [true, 'Diện tích phòng là bắt buộc'],
      min: [1, 'Diện tích phải lớn hơn 0'],
    },
    length: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    maxOccupants: {
      type: Number,
      required: [true, 'Số người ở tối đa là bắt buộc'],
      min: [1, 'Số người tối đa ít nhất là 1'],
    },
    address: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      ward: { type: String, required: true },
      detail: { type: String, required: true },
      lat: { type: Number, default: 10.762622 }, // Fallback to TP.HCM coordinates
      lng: { type: Number, default: 106.660172 },
    },
    amenities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenity',
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        isMain: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['available', 'rented', 'hidden', 'deleted'],
      default: 'available',
    },
    moderationStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'needs_edit'],
      default: 'draft',
    },
    moderationNote: {
      type: String,
      default: '',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
    allowPets: {
      type: Boolean,
      default: false,
    },
    freeHours: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    favoriteCount: {
      type: Number,
      default: 0,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search queries
roomSchema.index({ title: 'text', description: 'text', 'address.detail': 'text' });
roomSchema.index({ 'address.province': 1, 'address.district': 1, 'address.ward': 1 });
roomSchema.index({ price: 1, area: 1 });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
