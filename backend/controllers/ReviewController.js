const db = require('../config/db');

// 📝 Get my review for a product
exports.getMyReview = (req, res) => {
    const userId = req.user.id;
    const productId = req.params.productId;

    const sql = 'SELECT * FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1';
    db.query(sql, [userId, productId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to load review' });
        if (rows.length === 0) return res.json({ review: null });
        res.json({ review: rows[0] });
    });
};

// ⭐ Add or update review
exports.addOrUpdateReview = (req, res) => {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;
    const numericRating = parseInt(rating, 10);

    // console.log('Received review:', { userId, productId, numericRating, comment });

    if (!productId || !numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'Product ID and valid rating (1-5) are required' });
    }

    // Confirm product exists
    db.query('SELECT id FROM products WHERE id = ?', [productId], (err, productRows) => {
        if (err) {
            console.error('Check product error:', err);
            return res.status(500).json({ message: 'Failed to check product' });
        }
        if (productRows.length === 0) {
            return res.status(400).json({ message: 'Product does not exist' });
        }

        db.query('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [userId, productId], (err, rows) => {
            if (err) {
                console.error('Check review error:', err);
                return res.status(500).json({ message: 'Failed to check review' });
            }

            if (rows.length > 0) {
                // Update
                db.query('UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?', 
                         [numericRating, comment, rows[0].id], (err) => {
                    if (err) {
                        console.error('Update review error:', err);
                        return res.status(500).json({ message: 'Failed to update review' });
                    }
                    res.json({ message: 'Review updated successfully' });
                });
            } else {
                // Insert
                db.query('INSERT INTO reviews (user_id, product_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', 
                         [userId, productId, numericRating, comment], (err) => {
                    if (err) {
                        console.error('Insert review error:', err);
                        return res.status(500).json({ message: 'Failed to add review' });
                    }
                    res.json({ message: 'Review added successfully' });
                });
            }
        });
    });
};

// ❌ Delete review
exports.deleteReview = (req, res) => {
    const userId = req.user.id;
    const productId = req.params.productId;

    db.query('DELETE FROM reviews WHERE user_id = ? AND product_id = ?', [userId, productId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to delete review' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: 'Review deleted successfully' });
    });
};
