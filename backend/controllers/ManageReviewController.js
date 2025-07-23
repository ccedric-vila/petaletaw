const db = require('../config/db');

// Get all reviews with user & product info
exports.getAllReviews = (req, res) => {
    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               u.id as user_id, u.name as user_name,
               p.id as product_id, p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to load reviews' });
        res.json({ reviews: rows });
    });
};

// Delete review by ID
exports.deleteReviewById = (req, res) => {
    const reviewId = req.params.id;
    const sql = 'DELETE FROM reviews WHERE id = ?';
    db.query(sql, [reviewId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to delete review' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: 'Review deleted successfully' });
    });
};
