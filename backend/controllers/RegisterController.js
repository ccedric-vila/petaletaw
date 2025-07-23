const connection = require('../config/db');
const bcrypt = require('bcrypt');
const mailer = require('../utils/mailer'); // <-- import mailer
const crypto = require('crypto'); // for generating random token

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        connection.query(
            'INSERT INTO users (name, email, password, email_verification_token) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, verificationToken],
            async (err, result) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ message: 'Database error.' });
                }

                // Send confirmation email
                const confirmUrl = `http://localhost:4000/api/v1/auth/verify-email?token=${verificationToken}`;
                const message = `
                    Hi ${name},<br><br>
                    Please click the link below to verify your email address:<br>
                    <a href="${confirmUrl}">${confirmUrl}</a><br><br>
                    Thanks!
                `;

                try {
                    await mailer({
                        email,
                        subject: 'Please verify your email',
                        message
                    });
                    res.status(201).json({ message: 'Registered successfully. Please check your email to verify your account.' });
                } catch (mailErr) {
                    console.error("Mailer error:", mailErr);
                    res.status(500).json({ message: 'Registration successful, but failed to send confirmation email.' });
                }
            }
        );
    } catch (err) {
        console.error("Hashing error:", err);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { registerUser };
