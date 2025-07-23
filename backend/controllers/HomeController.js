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
