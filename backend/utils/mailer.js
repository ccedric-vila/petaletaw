const nodemailer = require('nodemailer');

const mailer = async (options) => {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // false is correct for port 587
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    console.log('SMTP_USER:', process.env.SMTP_EMAIL);
    console.log('SMTP_PASS:', process.env.SMTP_PASSWORD);

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: `<p>${options.message}</p>`,
        attachments: options.attachments || []   // ✅ support attachments if passed
    };

    await transporter.sendMail(message);
};

module.exports = mailer;
