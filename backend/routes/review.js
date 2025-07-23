const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const auth = require('../middlewares/auth'); // adjust path if your structure differs

// ⭐ Get my review for a product
router.get('/review/:productId', auth, ReviewController.getMyReview);

// ⭐ Add or update review
router.post('/review', auth, ReviewController.addOrUpdateReview);

// ❌ Delete review
router.delete('/review/:productId', auth, ReviewController.deleteReview);

module.exports = router;
