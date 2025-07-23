const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/AdminDashboardController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

router.get('/admindashboard', auth, admin, getAdminDashboard);

module.exports = router;
