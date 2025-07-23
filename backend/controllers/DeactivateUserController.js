const connection = require('../config/db');

const deactivateUser = (req, res) => {
    const userId = req.body.userId;

    const sql = `UPDATE users SET deleted_at = NOW() WHERE id = ?`;

    connection.execute(sql, [userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error' });
        }

        return res.status(200).json({ success: true, message: 'User deactivated' });
    });
};

module.exports = { deactivateUser };
