const db = require('../config/db');

// ✅ Final checkout - Create order and process payment
exports.processFinalCheckout = (req, res) => {
    const userId = req.user.id;
    const { checkoutData, paymentMethod, shippingAddress } = req.body;

    // Validate required data
    if (!checkoutData || !checkoutData.items || checkoutData.items.length === 0) {
        return res.status(400).json({ message: 'Checkout data is required' });
    }

    // Use provided shipping address or get from user profile
    let finalShippingAddress = shippingAddress;
    
    if (!finalShippingAddress) {
        const getUserAddressSql = `SELECT address FROM users WHERE id = ? AND status = 'active' LIMIT 1`;
        db.query(getUserAddressSql, [userId], (err, userResult) => {
            if (err) return res.status(500).json({ message: 'Failed to get user address' });

            const userAddress = userResult[0]?.address?.trim();
            if (!userResult.length || !userAddress) {
                return res.status(400).json({ 
                    message: 'Shipping address is required. Please update your profile or provide an address.' 
                });
            }

            finalShippingAddress = userAddress;
            createOrder();
        });
    } else {
        createOrder();
    }

    function createOrder() {
        // Start transaction
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ message: 'Transaction failed to start' });

            // Create the order
            const createOrderSql = `
                INSERT INTO orders (user_id, total_amount, shipping_address, status, created_at, updated_at) 
                VALUES (?, ?, ?, 'Pending', NOW(), NOW())
            `;
            
            const totalAmount = checkoutData.total;

            db.query(createOrderSql, [userId, totalAmount, finalShippingAddress], (err, orderResult) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Failed to create order' });
                    });
                }

                const orderId = orderResult.insertId;

                // Prepare order items for batch insert
                const orderItemsValues = checkoutData.items.map(item => [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price,
                    new Date(),
                    new Date()
                ]);

                // Insert order items
                const insertOrderItemsSql = `
                    INSERT INTO order_items (order_id, product_id, quantity, price, created_at, updated_at) 
                    VALUES ?
                `;

                db.query(insertOrderItemsSql, [orderItemsValues], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Failed to create order items' });
                        });
                    }

                    // If cart checkout, clear the cart items
                    if (checkoutData.checkoutType === 'cart') {
                        const clearCartSql = checkoutData.selectedItems === 'all' 
                            ? 'DELETE FROM cart_items WHERE user_id = ?'
                            : `DELETE FROM cart_items WHERE user_id = ? AND product_id IN (${checkoutData.selectedItems.map(() => '?').join(',')})`;
                        
                        const clearCartParams = checkoutData.selectedItems === 'all' 
                            ? [userId]
                            : [userId, ...checkoutData.selectedItems];

                        db.query(clearCartSql, clearCartParams, (err) => {
                            if (err) {
                                console.error('Failed to clear cart:', err);
                                // Don't fail the transaction, just log it
                            }

                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Failed to commit transaction' });
                                    });
                                }

                                res.json({
                                    message: 'Order placed successfully!',
                                    orderId: orderId,
                                    totalAmount: totalAmount,
                                    shippingAddress: finalShippingAddress
                                });
                            });
                        });
                    } else {
                        // Solo checkout - no cart to clear
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Failed to commit transaction' });
                                });
                            }

                            res.json({
                                message: 'Order placed successfully!',
                                orderId: orderId,
                                totalAmount: totalAmount,
                                shippingAddress: finalShippingAddress
                            });
                        });
                    }
                });
            });
        });
    }
};