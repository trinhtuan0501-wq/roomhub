const express = require('express');
const rentalRequestController = require('../controllers/rentalRequestController');
const { protect, restrictTo, isVerified } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All request routes require authentication

// Tenant routes
router.post('/', restrictTo('tenant'), isVerified, rentalRequestController.createRequest);
router.get('/my', restrictTo('tenant'), rentalRequestController.getTenantRequests);
router.patch('/:id/cancel', restrictTo('tenant'), rentalRequestController.cancelRequest);

// Landlord routes
router.get('/landlord', restrictTo('landlord'), rentalRequestController.getLandlordRequests);
router.patch('/:id/accept', restrictTo('landlord'), rentalRequestController.acceptRequest);
router.patch('/:id/reject', restrictTo('landlord'), rentalRequestController.rejectRequest);
router.patch('/:id/complete', restrictTo('landlord'), rentalRequestController.completeRequest);

module.exports = router;
