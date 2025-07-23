const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');

// Public home route to get products (no auth)
router.get('/home', HomeController.getHomeData);

// Public route to get product reviews (no auth)
router.get('/reviews/:productId', HomeController.getProductReviews);

module.exports = router;