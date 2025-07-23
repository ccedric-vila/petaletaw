const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/SupplierController');

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Admin-only routes
router.post('/supplier',  auth, admin, SupplierController.createSupplier);
router.get('/supplier',  auth, admin, SupplierController.getSuppliers);
router.get('/supplier/:id',  auth, admin, SupplierController.getSupplierById);      
router.put('/supplier/:id', auth, admin, SupplierController.updateSupplier);       
router.delete('/supplier/:id', auth, admin, SupplierController.deleteSupplier);

module.exports = router;
