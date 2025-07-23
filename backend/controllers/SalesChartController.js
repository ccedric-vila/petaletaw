const db = require('../config/db');

// Pie chart: Most sold products
exports.getMostSoldProducts = (req, res) => {
    const sql = `
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY oi.product_id
        ORDER BY total_sold DESC
        LIMIT 10
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};

// Line chart: Most buyer addresses (number of orders)
exports.getOrdersByAddress = (req, res) => {
    const sql = `
        SELECT shipping_address as address, COUNT(*) as total_orders
        FROM orders
        GROUP BY shipping_address
        ORDER BY total_orders DESC
        LIMIT 10
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};

// Bar chart: Sales per month
exports.getMonthlySales = (req, res) => {
    const sql = `
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as total_sales
        FROM orders
        GROUP BY month
        ORDER BY month ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};
