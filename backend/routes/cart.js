const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const auth = require('../middlewares/auth'); // adjust path if needed

// ➕ Add to cart
router.post('/cart', auth, CartController.addToCart);

// 🛒 Get cart items
router.get('/cart', auth, CartController.getCart);

// 🗑 Remove item from cart
router.delete('/cart/:id', auth, CartController.removeFromCart);

// ➕ Increment quantity
router.put('/cart/:id/increment', auth, CartController.incrementQuantity);

// ➖ Decrement quantity
router.put('/cart/:id/decrement', auth, CartController.decrementQuantity);

module.exports = router;
