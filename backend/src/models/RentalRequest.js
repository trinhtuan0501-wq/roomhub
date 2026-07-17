const mongoose = require('mongoose');

const rentalRequestSchema = new mongoose.Schema(
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
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    message: {
      type: String,
      default: '',
    },
    viewingDate: {
      type: Date,
      required: [true, 'Lịch xem phòng dự kiến là bắt buộc'],
    },
    landlordNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const RentalRequest = mongoose.model('RentalRequest', rentalRequestSchema);
module.exports = RentalRequest;
