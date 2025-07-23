const express = require('express');
const router = express.Router();
const HomeCheckoutController = require('../controllers/HomeCheckoutController');
const CartCheckoutController = require('../controllers/CartCheckoutController');
const FinalCheckoutController = require('../controllers/FinalCheckoutController');
const auth = require('../middlewares/auth');

// Home checkout route
router.post('/checkout/prepare-solo', auth, HomeCheckoutController.prepareSoloCheckout);

// Cart checkout route
router.post('/checkout/prepare-cart', auth, CartCheckoutController.prepareCartCheckout);

// Final checkout route
router.post('/checkout/process-final', auth, FinalCheckoutController.processFinalCheckout);

module.exports = router;