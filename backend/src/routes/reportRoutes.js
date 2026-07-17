const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, isVerified } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/room/:roomId', protect, isVerified, reportController.createReport);

module.exports = router;
