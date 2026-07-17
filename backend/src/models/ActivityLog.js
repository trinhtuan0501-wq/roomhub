const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'LOGIN', 'LOGOUT', 'REGISTER', 'CREATE_ROOM', 'UPDATE_ROOM', 'APPROVE_ROOM', 'REJECT_ROOM', 'LOCK_USER', 'UNLOCK_USER'
    },
    target: {
      type: String,
      // e.g. 'Room', 'User', 'RentalRequest'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Map,
      of: String,
    },
    ip: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log creation time
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;
