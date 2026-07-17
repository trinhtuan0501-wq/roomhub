const express = require('express');
const roomController = require('../controllers/roomController');
const { protect, restrictTo, isVerified } = require('../middleware/authMiddleware');
const { validateRoom } = require('../middleware/validateMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

// PUBLIC ROUTES
router.get('/', roomController.getRooms);
router.get('/featured', roomController.getFeaturedRooms);
router.get('/:id/related', roomController.getRelatedRooms);

// LANDLORD ROUTES (PROTECTED)
router.get('/my', protect, restrictTo('landlord'), roomController.getLandlordRooms);
router.get('/stats', protect, restrictTo('landlord'), roomController.getLandlordStats);

router.post('/', protect, restrictTo('landlord'), isVerified, validateRoom, roomController.createRoom);
router.put('/:id', protect, restrictTo('landlord'), isVerified, validateRoom, roomController.updateRoom);
router.patch('/:id/toggle', protect, restrictTo('landlord'), roomController.toggleStatus);
router.delete('/:id', protect, restrictTo('landlord'), roomController.deleteRoom);

// Images Upload
router.post(
  '/:id/images',
  protect,
  restrictTo('landlord'),
  upload.array('images', 6), // Limit max 6 images
  roomController.uploadRoomImages
);
router.delete('/:id/images/:imageId', protect, restrictTo('landlord'), roomController.deleteRoomImage);

// DETAIL ROUTE (must be last to avoid catching subpaths like '/my' or '/stats')
router.get('/:id', roomController.getRoom);

module.exports = router;
