const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tiện ích là bắt buộc'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: 'star',
    },
    category: {
      type: String,
      enum: ['basic', 'safety', 'facility', 'policy'],
      default: 'basic',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Amenity = mongoose.model('Amenity', amenitySchema);
module.exports = Amenity;
