const express = require('express');
const router = express.Router();
const ManageReviewController = require('../controllers/ManageReviewController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Only admin can see & delete reviews
router.get('/managereview', auth, admin, ManageReviewController.getAllReviews);
router.delete('/managereview/:id', auth, admin, ManageReviewController.deleteReviewById);

module.exports = router;
