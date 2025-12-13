
const nodemailer = require('nodemailer');

// **IMPROVEMENT**: Add a clear startup check for essential email variables.
// This helps diagnose .env configuration issues immediately when the server starts.
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("---------------------------------------------------------------------------");
    console.error("FATAL EMAIL CONFIG ERROR: Email service is not configured correctly.");
    console.error("Please ensure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS are set in your .env file.");
    console.error("This can be caused by a typo, missing variable, or syntax error in the .env file.");
    console.error("---------------------------------------------------------------------------");
}


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

const createEmailTemplate = (title, content) => {
    const brandColor = '#E11D48';
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            .header { background-color: ${brandColor}; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .footer { background-color: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
            .button { background-color: ${brandColor}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>${title}</h1></div>
            <div class="content">${content}</div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Ladies Smart Choice. All rights reserved.</p>
                <p>${process.env.COMPANY_ADDRESS || '123 Fashion Ave, Mumbai, India'}</p>
            </div>
        </div>
    </body>
    </html>
    `;
};


/**
 * Sends a welcome email to a new user.
 * @param {string} email - The recipient's email address.
 * @param {string} name - The user's name.
 */
const sendWelcomeEmail = async (email, name) => {
    const content = `
        <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi ${name},</h2>
        <p>Welcome to Ladies Smart Choice! We're thrilled to have you as part of our community.</p>
        <p>You can now explore our latest collections, manage your orders, and enjoy a seamless shopping experience.</p>
        <p style="text-align:center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://ladiessmartchoice.com'}" class="button">Start Shopping</a>
        </p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Happy Shopping!</p>
    `;

    const mailOptions = {
        from: `"Ladies Smart Choice" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Ladies Smart Choice!',
        html: createEmailTemplate('Welcome!', content)
    };
    await transporter.sendMail(mailOptions);
};

/**
 * Sends an order confirmation email with a PDF invoice attached.
 * @param {object} order - The full order object.
 * @param {Buffer} invoicePdfBuffer - The generated PDF invoice as a buffer.
 */
const sendOrderConfirmationEmail = async (order, invoicePdfBuffer) => {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} (x${item.quantity})</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const content = `
        <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi ${order.customerName},</h2>
        <p>Thank you for your order! We've received it and are getting it ready for shipment. You can find your invoice attached to this email.</p>
        <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 30px;">Order Summary (ID: #${order.id.substring(0, 8)})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${itemsHtml}
            <tr style="font-weight: bold;">
                <td style="padding: 10px; text-align: right;">Total:</td>
                <td style="padding: 10px; text-align: right;">₹${order.total.toFixed(2)}</td>
            </tr>
        </table>
        <p>We'll notify you again once your order has been shipped. You can view your order details anytime in your dashboard.</p>
    `;

    const mailOptions = {
        from: `"Ladies Smart Choice" <${process.env.EMAIL_USER}>`,
        to: order.customerEmail,
        subject: `Your Ladies Smart Choice Order Confirmation #${order.id.substring(0, 8)}`,
        html: createEmailTemplate('Order Confirmed!', content),
        attachments: [{
            filename: `invoice_${order.id.substring(0, 8)}.pdf`,
            content: invoicePdfBuffer,
            contentType: 'application/pdf'
        }]
    };
    await transporter.sendMail(mailOptions);
};


/**
 * Sends a password reset OTP to the user's email.
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The One-Time Password to send.
 */
const sendPasswordResetOTP = async (email, otp) => {
    const content = `
        <h2 style="font-size: 20px; color: #333; margin-top: 0;">Password Reset Request</h2>
        <p>We received a request to reset your password. Use the One-Time Password (OTP) below to proceed. This OTP is valid for 10 minutes.</p>
        <p style="background-color: #f1f1f1; border-radius: 4px; padding: 15px 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
        </p>
        <p>If you did not request this, please ignore this email.</p>
    `;
    const mailOptions = {
        from: `"Ladies Smart Choice" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Password Reset OTP',
        html: createEmailTemplate('Password Reset', content)
    };
    await transporter.sendMail(mailOptions);
};

/**
 * Sends the content of the contact form to the admin.
 * @param {string} name - Sender's name.
 * @param {string} email - Sender's email.
 * @param {string} subject - Message subject.
 * @param {string} message - Message content.
 */
const sendContactFormEmail = async (name, email, subject, message) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
        throw new Error("Admin email is not configured.");
    }

    const content = `
        <p>You've received a new message from your website's contact form.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 15px; white-space: pre-wrap; font-size: 14px;">${message}</div>
    `;

    const mailOptions = {
        from: `"Contact Form" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        replyTo: email,
        subject: `New Contact Form Submission: ${subject}`,
        html: createEmailTemplate('New Message', content)
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetOTP, sendContactFormEmail, sendWelcomeEmail, sendOrderConfirmationEmail };
