const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');

// Public home route to get products (no auth)
router.get('/home', HomeController.getHomeData);

module.exports = router;
