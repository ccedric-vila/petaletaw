require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const path = require('path');
const app = express();


// ✅ Connect to database
require('./config/db');

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static frontend and uploaded images
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// ✅ Import route files
const userRoutes = require('./routes/user');
const homeRoutes = require('./routes/home');
const adminRoutes = require('./routes/admindashboard');
const productRoutes = require('./routes/product');
const supplierRoutes = require('./routes/supplier');
const manageuserRoutes = require('./routes/manageuser');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/order');
const reviewRoutes = require('./routes/review');
const manageReviewRoutes = require('./routes/managereview');
const salesChartRoutes = require('./routes/saleschart');





// ✅ Mount routes under same API version prefix
app.use('/api/v1/', cartRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', homeRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', supplierRoutes);
app.use('/api/v1', manageuserRoutes);
app.use('/api/v1', checkoutRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1/', manageReviewRoutes);
app.use('/api/v1/', salesChartRoutes);


// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("PORT:", PORT);
    console.log("DB_USER:", process.env.DB_USER);
    console.log(`Server is running on port ${PORT}`);
});
