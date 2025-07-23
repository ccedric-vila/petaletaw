const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const auth = require('../middlewares/auth'); // adjust if needed
const admin = require('../middlewares/admin'); // adjust if needed

// Get all orders
router.get('/orders', auth, admin, OrderController.getAllOrders);

// Accept an order
router.put('/orders/:id/accept', auth, admin, OrderController.acceptOrder);

// Update status
router.put('/orders/:id/status', auth, admin, OrderController.updateOrderStatus);

module.exports = router;
