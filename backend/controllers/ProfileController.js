const connection = require('../config/db');

const updateUser = (req, res) => {
    const { name, contact_number, address, userId } = req.body;

    let sql, params;

    if (req.file) {
        const profile_image = req.file.path.replace(/\\/g, "/");

        sql = `
            UPDATE users SET 
                name = ?,
                contact_number = ?,
                address = ?,
                profile_image = ?
            WHERE id = ? AND deleted_at IS NULL
        `;

        params = [name, contact_number, address, profile_image, userId];
    } else {
        sql = `
            UPDATE users SET 
                name = ?,
                contact_number = ?,
                address = ?
            WHERE id = ? AND deleted_at IS NULL
        `;

        params = [name, contact_number, address, userId];
    }

    connection.execute(sql, params, (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ error: 'Error updating user', details: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or already deleted' });
        }

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            result
        });
    });
};

const getProfile = (req, res) => {
    const userId = req.params.id;

    const sql = 'SELECT id, name, email, role, contact_number, address, profile_image FROM users WHERE id = ? AND deleted_at IS NULL';
    connection.execute(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json({ user: results[0] });
    });
};

module.exports = { updateUser, getProfile };