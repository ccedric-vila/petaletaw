const connection = require('../config/db');

exports.getHomeData = (req, res) => {
    // Public: get products
    connection.query('SELECT * FROM products', (err, products) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load products' });
        }
        res.json({ products });
    });
};

exports.getProductReviews = (req, res) => {
    const { productId } = req.params;
    
    const query = `
        SELECT r.rating, r.comment, r.created_at, u.name as user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN order_items oi ON r.order_id = oi.order_id
        WHERE oi.product_id = ?
        ORDER BY r.created_at DESC
    `;
    
    connection.query(query, [productId], (err, reviews) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load reviews' });
        }
        res.json({ reviews });
    });
};