const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// PUBLIC/SHARED GET ENDPOINTS FOR SELECT OPTIONS (no auth required)
router.get('/room-types', adminController.getRoomTypes);
router.get('/amenities', adminController.getAmenities);

// ALL OTHER ADMIN ROUTES ARE PROTECTED AND RESTRICTED TO ADMIN
router.use(protect);
router.use(restrictTo('admin'));

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.changeUserRole);

// Room Moderation
router.get('/rooms', adminController.getRooms);
router.patch('/rooms/:id/approve', adminController.approveRoom);
router.patch('/rooms/:id/reject', adminController.rejectRoom);
router.patch('/rooms/:id/toggle', adminController.toggleRoomVisibility);

// Report Management
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.handleReport);

// RoomTypes & Amenities Mutators
router.post('/room-types', adminController.createRoomType);
router.put('/room-types/:id', adminController.updateRoomType);
router.post('/amenities', adminController.createAmenity);
router.put('/amenities/:id', adminController.updateAmenity);

// System statistics and activity logs
router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getActivityLogs);

module.exports = router;
