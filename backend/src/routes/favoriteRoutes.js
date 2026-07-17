const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('tenant'));

router.post('/:roomId', favoriteController.toggleFavorite);
router.get('/', favoriteController.getFavorites);

module.exports = router;
