
const nodemailer = require('nodemailer');

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a password reset OTP to the user's email.
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The One-Time Password to send.
 */
const sendPasswordResetOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Ladies Smart Choice" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Password Reset OTP for Ladies Smart Choice',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                    <h1 style="color: #E11D48; margin: 0;">Ladies Smart Choice</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="font-size: 22px; color: #333; margin-top: 0;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Use the One-Time Password (OTP) below to proceed. This OTP is valid for 10 minutes.</p>
                    <p style="background-color: #f1f1f1; border-radius: 4px; padding: 15px 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
                        ${otp}
                    </p>
                    <p>If you did not request a password reset, please ignore this email or contact our support if you have concerns.</p>
                    <p style="margin-top: 30px;">Thanks,<br/>The Ladies Smart Choice Team</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    <p>&copy; ${new Date().getFullYear()} Ladies Smart Choice. All rights reserved.</p>
                </div>
            </div>
        `
    };

    // Send mail with defined transport object
    await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetOTP };
