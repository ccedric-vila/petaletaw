const db = require('../config/db'); // adjust path if needed

// ➕ Add to cart
exports.addToCart = (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const checkSql = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?';
    db.query(checkSql, [userId, productId], (err, rows) => {
        if (err) {
            console.error('Check cart error:', err);
            return res.status(500).json({ message: 'Failed to check cart' });
        }

        if (rows.length > 0) {
            const updateSql = 'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?';
            db.query(updateSql, [quantity || 1, userId, productId], (err) => {
                if (err) {
                    console.error('Update cart error:', err);
                    return res.status(500).json({ message: 'Failed to update cart' });
                }
                return res.json({ message: 'Cart updated successfully' });
            });
        } else {
            const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
            db.query(insertSql, [userId, productId, quantity || 1], (err) => {
                if (err) {
                    console.error('Add to cart error:', err);
                    return res.status(500).json({ message: 'Failed to add to cart' });
                }
                res.json({ message: 'Added to cart successfully' });
            });
        }
    });
};

// 🛒 Get cart items
exports.getCart = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT c.id AS cart_item_id, c.quantity, p.id AS product_id, p.name, p.price, p.image
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Get cart error:', err);
            return res.status(500).json({ message: 'Failed to get cart' });
        }
        res.json({ cart: rows });
    });
};

// 🗑 Remove item from cart
exports.removeFromCart = (req, res) => {
    const userId = req.user.id;
    const cartItemId = req.params.id;

    const sql = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?';
    db.query(sql, [cartItemId, userId], (err) => {
        if (err) {
            console.error('Remove from cart error:', err);
            return res.status(500).json({ message: 'Failed to remove item' });
        }
        res.json({ message: 'Item removed successfully' });
    });
};

// ➕ Increment quantity
exports.incrementQuantity = (req, res) => {
    const { id } = req.params; // id = cart_items.id
    db.query('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Failed to increment:', err);
            return res.status(500).json({ error: 'Failed to increment' });
        }
        res.json({ message: 'Quantity increased' });
    });
};

// ➖ Decrement quantity (won't go below 1)
exports.decrementQuantity = (req, res) => {
    const { id } = req.params; // id = cart_items.id
    db.query('UPDATE cart_items SET quantity = quantity - 1 WHERE id = ? AND quantity > 1', [id], (err, result) => {
        if (err) {
            console.error('Failed to decrement:', err);
            return res.status(500).json({ error: 'Failed to decrement' });
        }
        res.json({ message: 'Quantity decreased' });
    });
};