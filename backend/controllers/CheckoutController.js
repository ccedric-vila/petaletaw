const db = require('../config/db');

// 🛒 Solo checkout (updated)
exports.checkoutSolo = (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    const getProductSql = "SELECT id, price FROM products WHERE id = ?";
    db.query(getProductSql, [productId], (err, products) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (products.length === 0) {
            return res.status(400).json({ message: 'Product not found' });
        }

        const product = products[0];
        const createOrderSql = 'INSERT INTO orders (user_id, status, created_at, updated_at) VALUES (?, "pending", NOW(), NOW())';
        db.query(createOrderSql, [userId], (err, orderResult) => {
            if (err) return res.status(500).json({ message: 'Failed to create order' });

            const orderId = orderResult.insertId;
            const insertItemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())';
            db.query(insertItemSql, [orderId, product.id, 1, product.price], (err) => {
                if (err) return res.status(500).json({ message: 'Failed to add order item' });

                res.json({ message: 'Solo checkout prepared', orderId });
            });
        });
    });
};

// 🛒 Cart checkout (updated)
exports.checkoutCart = (req, res) => {
    const userId = req.user.id;

    const getCartSql = `
        SELECT c.product_id, c.quantity, p.price
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `;
    db.query(getCartSql, [userId], (err, cartItems) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        const createOrderSql = 'INSERT INTO orders (user_id, status, created_at, updated_at) VALUES (?, "Pending", NOW(), NOW())';
        db.query(createOrderSql, [userId], (err, orderResult) => {
            if (err) return res.status(500).json({ message: 'Failed to create order' });

            const orderId = orderResult.insertId;
            const values = cartItems.map(item => [orderId, item.product_id, item.quantity, item.price, new Date(), new Date()]);
            const insertItemsSql = 'INSERT INTO order_items (order_id, product_id, quantity, price, created_at, updated_at) VALUES ?';

            db.query(insertItemsSql, [values], (err) => {
                if (err) return res.status(500).json({ message: 'Failed to add order items' });

                db.query('DELETE FROM cart_items WHERE user_id = ?', [userId], (err) => {
                    if (err) return res.status(500).json({ message: 'Checked out but failed to clear cart' });
                    res.json({ message: 'Cart checkout prepared', orderId });
                });
            });
        });
    });
};

// 📦 Get checkout details (updated)
exports.getCheckoutDetails = (req, res) => {
    const userId = req.user.id;

    const getOrderSql = `
        SELECT id 
        FROM orders 
        WHERE user_id = ? AND status = 'Pending' AND shipping_address IS NULL
        ORDER BY created_at DESC LIMIT 1
    `;
    db.query(getOrderSql, [userId], (err, orderRows) => {
        if (err) return res.status(500).json({ message: 'Could not load pending order' });
        if (!orderRows.length) {
            return res.status(400).json({ message: 'No pending order found' });
        }

        const orderId = orderRows[0].id;

        const getItemsSql = `
            SELECT oi.*, p.name, p.image, p.price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;
        db.query(getItemsSql, [orderId], (err, items) => {
            if (err) return res.status(500).json({ message: 'Could not load checkout items' });

            const getUserAddressSql = `SELECT address FROM users WHERE id = ? LIMIT 1`;
            db.query(getUserAddressSql, [userId], (err, userRows) => {
                if (err) return res.status(500).json({ message: 'Could not load user address' });

                const userAddress = userRows.length && userRows[0].address 
                    ? userRows[0].address.trim() 
                    : 'No address found';

                res.json({ checkout: items, userAddress, orderId });
            });
        });
    });
};

// ✅ Confirm checkout (no changes needed as it doesn't reference price)
exports.confirmCheckout = (req, res) => {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) return res.status(400).json({ message: 'Order ID is required' });

    const getUserAddressSql = `SELECT address FROM users WHERE id = ? AND status = 'active' LIMIT 1`;
    db.query(getUserAddressSql, [userId], (err, userResult) => {
        if (err) return res.status(500).json({ message: 'Failed to get user address' });

        const userAddress = userResult[0]?.address?.trim();
        if (!userResult.length || !userAddress) {
            return res.status(400).json({ message: 'User address not found or empty. Please update your profile first.' });
        }

        const getItemsSql = `SELECT product_id, quantity FROM order_items WHERE order_id = ?`;
        db.query(getItemsSql, [orderId], (err, items) => {
            if (err) return res.status(500).json({ message: 'Failed to get order items' });
            if (items.length === 0) return res.status(400).json({ message: 'No items found in order' });

            const updateOrderSql = `
                UPDATE orders
                SET shipping_address = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ? AND status = 'Pending' AND shipping_address IS NULL
            `;
            db.query(updateOrderSql, [userAddress, orderId, userId], (err, result) => {
                if (err) return res.status(500).json({ message: 'Failed to confirm order' });
                if (result.affectedRows === 0) {
                    return res.status(400).json({ message: 'Order not found, already confirmed, or does not belong to you' });
                }

                const stockUpdates = items.map(item =>
                    new Promise((resolve, reject) => {
                        db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id], (err) => {
                            if (err) reject(err); else resolve();
                        });
                    })
                );

                Promise.all(stockUpdates)
                    .then(() => res.json({ message: 'Order placed successfully!', userAddress }))
                    .catch((err) => {
                        console.error('Failed to reduce stock:', err);
                        res.status(500).json({ message: 'Order confirmed but failed to update stock' });
                    });
            });
        });
    });
};