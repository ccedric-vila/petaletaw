const connection = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    connection.execute(
        'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        [email],
        async (err, results) => {
            if (err) return res.status(500).json({ message: 'Server error' });

            // User not found
            if (!results.length) {
                return res.status(404).json({ message: 'User not found' });
            }

            const user = results[0];

            // User found but not verified
            if (user.is_verified !== 'yes') {
                return res.status(401).json({ message: 'Email not verified' });
            }

            // User found but inactive
            if (user.status !== 'active') {
                return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
            }

            // Check password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ message: 'Email or password incorrect' });
            }

            // All good: create token
            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' }
            );

            res.status(200).json({
                success: 'Login successful!',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }
    );
};

module.exports = { loginUser };
