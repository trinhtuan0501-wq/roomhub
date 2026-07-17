const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo, isVerified } = require('../middleware/authMiddleware');

const router = express.Router();

// Public review retrieval
router.get('/room/:roomId', reviewController.getRoomReviews);

// Protected review posting
router.post('/room/:roomId', protect, restrictTo('tenant'), isVerified, reviewController.createReview);

// Delete reviews
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;
