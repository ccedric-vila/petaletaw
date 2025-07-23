const db = require('../config/db');

// 🛒 Cart page - Selected items checkout preparation
exports.prepareCartCheckout = (req, res) => {
    const userId = req.user.id;
    const { selectedItems } = req.body; // Array of cart item IDs or product IDs

    // If no selected items, get all cart items
    let getCartSql;
    let queryParams;

    if (selectedItems && selectedItems.length > 0) {
        // Specific selected items
        const placeholders = selectedItems.map(() => '?').join(',');
        getCartSql = `
            SELECT c.product_id, c.quantity, p.name, p.price, p.image, p.stock,
                   (c.quantity * p.price) as subtotal
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ? AND c.product_id IN (${placeholders})
        `;
        queryParams = [userId, ...selectedItems];
    } else {
        // All cart items
        getCartSql = `
            SELECT c.product_id, c.quantity, p.name, p.price, p.image, p.stock,
                   (c.quantity * p.price) as subtotal
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;
        queryParams = [userId];
    }

    db.query(getCartSql, queryParams, (err, cartItems) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'No items found for checkout' });
        }

        // Check stock availability for all items
        const stockIssues = cartItems.filter(item => item.quantity > item.stock);
        if (stockIssues.length > 0) {
            const outOfStockItems = stockIssues.map(item => item.name);
            return res.status(400).json({ 
                message: 'Some items are out of stock', 
                outOfStockItems 
            });
        }

        // Get user's address
        const getUserAddressSql = `SELECT address FROM users WHERE id = ? LIMIT 1`;
        db.query(getUserAddressSql, [userId], (err, userRows) => {
            if (err) return res.status(500).json({ message: 'Could not load user address' });

            const userAddress = userRows.length && userRows[0].address 
                ? userRows[0].address.trim() 
                : null;

            // Calculate total
            const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

            // Format items for checkout display
            const formattedItems = cartItems.map(item => ({
                product_id: item.product_id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                subtotal: item.subtotal
            }));

            const checkoutData = {
                items: formattedItems,
                userAddress: userAddress || 'No address found',
                total: total,
                checkoutType: 'cart',
                selectedItems: selectedItems || 'all'
            };

            res.json({ 
                message: 'Cart checkout data prepared', 
                checkout: checkoutData 
            });
        });
    });
};