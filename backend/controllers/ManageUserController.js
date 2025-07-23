const connection = require('../config/db');

exports.getAllUsers = (req, res) => {
    connection.query(
        "SELECT id, name, email, contact_number, address, role, status FROM users WHERE deleted_at IS NULL",
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

exports.getUserById = (req, res) => {
    const { id } = req.params;
    connection.query(
        "SELECT id, name, email, contact_number, address, role, status FROM users WHERE id = ? AND deleted_at IS NULL",
        [id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'User not found' });
            res.json(results[0]);
        }
    );
};

exports.updateUserRoleStatus = (req, res) => {
    const { id } = req.params;
    const { role, status } = req.body;

    const sql = 'UPDATE users SET role = ?, status = ? WHERE id = ?';
    connection.query(sql, [role, status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User role and status updated' });
    });
};
