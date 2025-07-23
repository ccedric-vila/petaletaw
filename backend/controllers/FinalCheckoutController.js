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

            // Calculate total amount using product prices with JOIN
            let calculateTotalSql;
            let calculateTotalParams;

            if (checkoutData.checkoutType === 'cart') {
                // For cart checkout, get data from cart_items table with JOIN
                if (checkoutData.selectedItems === 'all') {
                    calculateTotalSql = `
                        SELECT 
                            p.id,
                            p.price,
                            SUM(c.quantity) as total_quantity
                        FROM cart_items c
                        JOIN products p ON c.product_id = p.id
                        WHERE c.user_id = ?
                        GROUP BY p.id, p.price
                    `;
                    calculateTotalParams = [userId];
                } else {
                    calculateTotalSql = `
                        SELECT 
                            p.id,
                            p.price,
                            SUM(c.quantity) as total_quantity
                        FROM cart_items c
                        JOIN products p ON c.product_id = p.id
                        WHERE c.user_id = ? AND p.id IN (${checkoutData.selectedItems.map(() => '?').join(',')})
                        GROUP BY p.id, p.price
                    `;
                    calculateTotalParams = [userId, ...checkoutData.selectedItems];
                }
            } else {
                // For solo checkout, use the provided items data
                const productIds = checkoutData.items.map(item => item.product_id);
                calculateTotalSql = `
                    SELECT 
                        p.id,
                        p.price
                    FROM products p 
                    WHERE p.id IN (${productIds.map(() => '?').join(',')})
                `;
                calculateTotalParams = productIds;
            }

            db.query(calculateTotalSql, calculateTotalParams, (err, priceResults) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Failed to calculate total amount' });
                    });
                }

                // Calculate the actual total amount
                let totalAmount = 0;

                if (checkoutData.checkoutType === 'cart') {
                    // For cart checkout, use the summed quantities from the query
                    priceResults.forEach(product => {
                        totalAmount += parseFloat(product.price) * parseInt(product.total_quantity);
                    });
                } else {
                    // For solo checkout, use the provided quantities
                    const itemMap = {};
                    checkoutData.items.forEach(item => {
                        if (itemMap[item.product_id]) {
                            itemMap[item.product_id] += parseInt(item.quantity);
                        } else {
                            itemMap[item.product_id] = parseInt(item.quantity);
                        }
                    });

                    priceResults.forEach(product => {
                        const quantity = itemMap[product.id] || 0;
                        totalAmount += parseFloat(product.price) * quantity;
                    });
                }

                // Create the order with calculated total
                const createOrderSql = `
                    INSERT INTO orders (user_id, total_amount, shipping_address, status, created_at, updated_at) 
                    VALUES (?, ?, ?, 'Pending', NOW(), NOW())
                `;

                db.query(createOrderSql, [userId, totalAmount, finalShippingAddress], (err, orderResult) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Failed to create order' });
                        });
                    }

                    const orderId = orderResult.insertId;

                    // Prepare order items for batch insert (without price)
                    const orderItemsValues = checkoutData.items.map(item => [
                        orderId,
                        item.product_id,
                        item.quantity,
                        new Date(),
                        new Date()
                    ]);

                    // Insert order items (without price field)
                    const insertOrderItemsSql = `
                        INSERT INTO order_items (order_id, product_id, quantity, created_at, updated_at) 
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
        });
    }
};