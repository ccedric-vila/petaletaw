const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/ReviewController');
const auth = require('../middlewares/auth');

// Order routes
router.get('/orders/history', auth, reviewController.getOrderHistory);
router.get('/orders/:orderId', auth, reviewController.getOrderDetails);

// Review routes
router.get('/reviews/item/:orderItemId', auth, reviewController.getReviewByOrderItem); // ADD THIS MISSING ROUTE
router.post('/reviews', auth, reviewController.addOrUpdateReview);
router.delete('/reviews/:order_item_id', auth, reviewController.deleteReview);

module.exports = router;