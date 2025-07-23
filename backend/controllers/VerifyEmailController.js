const connection = require('../config/db');

const verifyEmail = (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ message: 'Invalid or missing token.' });
    }

    connection.query(
        'SELECT * FROM users WHERE email_verification_token = ?',
        [token],
        (err, results) => {
            if (err) {
                console.error("DB error:", err);
                return res.status(500).json({ message: 'Server error.' });
            }

            if (results.length === 0) {
                return res.status(400).json({ message: 'Invalid token.' });
            }

            // Mark as verified
            connection.query(
                'UPDATE users SET is_verified = 1, email_verification_token = NULL WHERE id = ?',
                [results[0].id],
                (updateErr) => {
                    if (updateErr) {
                        console.error("Update error:", updateErr);
                        return res.status(500).json({ message: 'Server error.' });
                    }
                    res.json({ message: 'Email verified successfully. You can now log in.' });
                }
            );
        }
    );
};

module.exports = { verifyEmail };
