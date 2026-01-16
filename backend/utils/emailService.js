const { triggerAutomation, sendEmail } = require('../services/emailService');

/**
 * Sends a welcome email to a new user.
 */
const sendWelcomeEmail = async (email, name) => {
    return await triggerAutomation('WELCOME_USER', { email }, {
        customer_name: name,
        store_url: process.env.FRONTEND_URL || 'https://ladiessmartchoice.com'
    });
};

/**
 * Sends an order confirmation email with a PDF invoice attached.
 */
const sendOrderConfirmationEmail = async (order, invoicePdfBuffer) => {
    return await triggerAutomation('ORDER_CONFIRMATION', { email: order.customerEmail }, {
        customer_name: order.customerName,
        order_number: order._id.toString().substring(0, 8),
        order_total: order.total.toFixed(2)
    }, {
        context: { orderId: order._id },
        attachments: [{
            filename: `invoice_${order._id.toString().substring(0, 8)}.pdf`,
            content: invoicePdfBuffer,
            contentType: 'application/pdf'
        }]
    });
};

/**
 * Sends a password reset OTP to the user's email.
 */
const sendPasswordResetOTP = async (email, otp) => {
    return await triggerAutomation('FORGOT_PASSWORD', { email }, { otp });
};

/**
 * Sends the content of the contact form to the admin.
 * Keeping this one direct or could make a template.
 * For now, direct, as it's ADMIN facing, not Marketing Automation.
 */
const sendContactFormEmail = async (name, email, subject, message) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const content = `
        <p>You've received a new message from your website's contact form.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 15px; white-space: pre-wrap; font-size: 14px;">${message}</div>
    `;

    return await sendEmail({
        to: adminEmail,
        subject: `New Contact Form Submission: ${subject}`,
        html: content, // No wrapper needed for admin email, or could add one
        replyTo: email
    });
};

module.exports = { sendPasswordResetOTP, sendContactFormEmail, sendWelcomeEmail, sendOrderConfirmationEmail };
