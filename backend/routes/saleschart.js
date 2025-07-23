const express = require('express');
const router = express.Router();
const SalesChartController = require('../controllers/SalesChartController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

router.get('/charts/most-sold-products', auth, admin, SalesChartController.getMostSoldProducts);
router.get('/charts/orders-by-address', auth, admin, SalesChartController.getOrdersByAddress);
router.get('/charts/monthly-sales', auth, admin, SalesChartController.getMonthlySales);

module.exports = router;
