const connection = require('../config/db');

exports.createSupplier = (req, res) => {
    const { supplier_name, email, phone, address } = req.body;
    if (!supplier_name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    const sql = 'INSERT INTO supplier (supplier_name, email, phone, address) VALUES (?, ?, ?, ?)';
    connection.query(sql, [supplier_name, email, phone, address], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Supplier added', id: result.insertId });
    });
};

exports.getSuppliers = (req, res) => {
    connection.query('SELECT * FROM supplier', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getSupplierById = (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM supplier WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(results[0]);
    });
};

exports.updateSupplier = (req, res) => {
    const { id } = req.params;
    const { supplier_name, email, phone, address } = req.body;

    const sql = 'UPDATE supplier SET supplier_name = ?, email = ?, phone = ?, address = ? WHERE id = ?';
    connection.query(sql, [supplier_name, email, phone, address, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Supplier updated' });
    });
};

exports.deleteSupplier = (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM supplier WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Supplier deleted' });
    });
};
