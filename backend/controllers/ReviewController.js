const db = require('../config/db');


// 📋 Get order history for user (modified to use order_id for reviews)
exports.getOrderHistory = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT 
            o.id AS order_id,
            o.total_amount,
            o.status,
            DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') AS order_date,
            oi.id AS order_item_id,
            oi.quantity,
            p.id AS product_id,
            p.name AS product_name,
            p.price,
            p.image AS product_image,
            r.id AS review_id,
            r.rating,
            r.comment
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN reviews r ON o.id = r.order_id AND r.user_id = ?
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, oi.id
    `;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching order history:', err);
            return res.status(500).json({ message: 'Failed to load order history' });
        }

        // Group results by order
        const ordersMap = {};
        
        results.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    order_id: row.order_id,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    status: row.status,
                    items: [],
                    review: row.review_id ? {
                        id: row.review_id,
                        rating: row.rating,
                        comment: row.comment
                    } : null
                };
            }

            if (row.order_item_id) {
                ordersMap[row.order_id].items.push({
                    order_item_id: row.order_item_id,
                    quantity: row.quantity,
                    product_id: row.product_id,
                    product_name: row.product_name,
                    price: row.price,
                    product_image: row.product_image
                });
            }
        });

        const orders = Object.values(ordersMap);
        res.json({ orders });
    });
};

// 📝 Get order details by order ID (for orders with 2+ products)
exports.getOrderDetails = (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    const sql = `
        SELECT 
            o.id AS order_id,
            o.total_amount,
            o.status AS order_status,
            DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') AS order_date,
            COUNT(oi.id) AS product_count,
            GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ? AND o.id = ?
        GROUP BY o.id
        HAVING product_count >= 2
    `;

    db.query(sql, [userId, orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).json({ message: 'Failed to load order details' });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                message: 'Order not found, does not belong to you, or has less than 2 products' 
            });
        }

        const orderDetails = {
            order_id: results[0].order_id,
            order_date: results[0].order_date,
            total_amount: results[0].total_amount,
            status: results[0].order_status,
            product_count: results[0].product_count,
            product_names: results[0].product_names.split(', '),
            items: []
        };

        // Fetch individual items for the order
        const itemsSql = `
            SELECT 
                oi.id AS order_item_id,
                oi.quantity,
                p.id AS product_id,
                p.name AS product_name,
                p.price,
                p.image AS product_image
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;

        db.query(itemsSql, [orderId], (err, items) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return res.status(500).json({ message: 'Failed to load order items' });
            }

            orderDetails.items = items;
            res.json({ order: orderDetails });
        });
    });
};

// Get review by order ID (modified from orderItemId to orderId)
exports.getReviewByOrderItem = (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.orderItemId; // Keep same param name to avoid changing routes

    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at
        FROM reviews r
        JOIN orders o ON r.order_id = o.id
        WHERE r.order_id = ? AND o.user_id = ?
    `;

    db.query(sql, [orderId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching review:', err);
            return res.status(500).json({ message: 'Failed to load review' });
        }

        if (results.length === 0) {
            return res.json({ review: null });
        }

        res.json({ review: results[0] });
    });
};

// ⭐ Add or update review for an order (modified from order_item_id to order_id)
exports.addOrUpdateReview = (req, res) => {
    const userId = req.user.id;
    const { order_item_id, rating, comment } = req.body; // Keep same field name to avoid changing frontend
    const orderId = order_item_id; // Treat it as orderId
    const numericRating = parseInt(rating, 10);

    if (!orderId || !numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'Order ID and valid rating (1-5) are required' });
    }

    // Verify the order belongs to the user and is delivered
    db.query(`
        SELECT o.id, o.status 
        FROM orders o
        WHERE o.id = ? AND o.user_id = ?
    `, [orderId, userId], (err, rows) => {
        if (err) {
            console.error('Error verifying order:', err);
            return res.status(500).json({ message: 'Failed to verify order' });
        }
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Order not found or does not belong to you' });
        }
        if (rows[0].status !== 'Delivered') {
            return res.status(400).json({ message: 'You can only review delivered orders' });
        }

        // Check if review exists
        db.query('SELECT id FROM reviews WHERE user_id = ? AND order_id = ?', 
                [userId, orderId], (err, reviewRows) => {
            if (err) {
                console.error('Error checking review:', err);
                return res.status(500).json({ message: 'Failed to check review' });
            }

            if (reviewRows.length > 0) {
                // Update existing review
                db.query(`
                    UPDATE reviews 
                    SET rating = ?, comment = ?, updated_at = NOW() 
                    WHERE id = ?
                `, [numericRating, comment, reviewRows[0].id], (err) => {
                    if (err) {
                        console.error('Error updating review:', err);
                        return res.status(500).json({ message: 'Failed to update review' });
                    }
                    res.json({ message: 'Review updated successfully' });
                });
            } else {
                // Create new review
                db.query(`
                    INSERT INTO reviews 
                    (user_id, order_id, rating, comment, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `, [userId, orderId, numericRating, comment], (err) => {
                    if (err) {
                        console.error('Error creating review:', err);
                        return res.status(500).json({ message: 'Failed to create review' });
                    }
                    res.json({ message: 'Review added successfully' });
                });
            }
        });
    });
};

// ❌ Delete review for an order (modified from order_item_id to order_id)
exports.deleteReview = (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.order_item_id; // Keep same param name to avoid changing routes

    db.query(`
        DELETE r FROM reviews r
        JOIN orders o ON r.order_id = o.id
        WHERE r.order_id = ? AND o.user_id = ?
    `, [orderId, userId], (err, result) => {
        if (err) {
            console.error('Error deleting review:', err);
            return res.status(500).json({ message: 'Failed to delete review' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Review not found or not authorized' });
        }
        res.json({ message: 'Review deleted successfully' });
    });
};