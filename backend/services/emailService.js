const nodemailer = require('nodemailer');
const Automation = require('../models/Automation');
const EmailTemplate = require('../models/EmailTemplate');
const AutomationLog = require('../models/AutomationLog');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper to replace placeholders
const compileTemplate = (html, data) => {
    let compiled = html;
    for (const [key, value] of Object.entries(data)) {
        // Handle undefined safely
        const val = value !== undefined && value !== null ? value : '';
        compiled = compiled.replace(new RegExp(`{${key}}`, 'g'), val);
    }
    return compiled;
};

const brandColor = '#E11D48';
const baseLayout = (content, title) => `
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
                <p>123 Fashion Ave, Mumbai, India</p>
            </div>
        </div>
    </body>
    </html>
`;

// Default Templates (Fallbacks)
const defaultTemplates = {
    ABANDONED_CHECKOUT: {
        subject: 'You left something behind!',
        body: baseLayout(`
            <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi {customer_name},</h2>
            <p>You left items in your cart. Don't worry, we saved them for you.</p>
            <p><strong>Total: ₹{cart_total}</strong></p>
            <p style="text-align:center; margin: 30px 0;">
                <a href="{checkout_url}" class="button">Complete Purchase</a>
            </p>
        `, 'Forgotten Items')
    },
    ORDER_CONFIRMATION: {
        subject: 'Order Confirmation #{order_number}',
        body: baseLayout(`
            <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi {customer_name},</h2>
            <p>Thank you for your order! We've received it and are getting it ready for shipment.</p>
            <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 30px;">Order #{order_number}</h3>
            <p>Total: <strong>₹{order_total}</strong></p>
            <p>We'll notify you again once your order has been shipped.</p>
        `, 'Order Confirmed!')
    },
    ORDER_SHIPPED: {
        subject: 'Your order has shipped!',
        body: baseLayout(`
            <h2 style="font-size: 20px; color: #333; margin-top: 0;">Good news, {customer_name}!</h2>
            <p>Your order #{order_number} is on its way.</p>
            <p><strong>Tracking Number:</strong> {tracking_number}</p>
            <p><strong>Carrier:</strong> {carrier}</p>
            <p style="text-align:center; margin: 30px 0;">
                <a href="{tracking_url}" class="button">Track Package</a>
            </p>
        `, 'Order Shipped')
    },
    WELCOME_USER: {
        subject: 'Welcome to Ladies Smart Choice!',
        body: baseLayout(`
            <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi {customer_name},</h2>
            <p>Welcome to Ladies Smart Choice! We're thrilled to have you as part of our community.</p>
            <p style="text-align:center; margin: 30px 0;">
                <a href="{store_url}" class="button">Start Shopping</a>
            </p>
        `, 'Welcome!')
    },
    FORGOT_PASSWORD: {
        subject: 'Reset Password Request',
        body: baseLayout(`
            <h2 style="font-size: 20px; color: #333; margin-top: 0;">Password Reset</h2>
            <p>Use the One-Time Password (OTP) below to proceed. This OTP is valid for 10 minutes.</p>
            <p style="background-color: #f1f1f1; border-radius: 4px; padding: 15px 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
                {otp}
            </p>
        `, 'Password Reset')
    },
    INVOICE: {
        subject: 'Invoice for Order #{order_number}',
        body: baseLayout(`
            <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hello,</h2>
            <p>Please find attached the invoice for your recent order #{order_number}.</p>
        `, 'Invoice')
    }
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Ladies Smart Choice'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('SMTP Error:', error);
        return { success: false, error };
    }
};

/**
 * Triggers an automation email based on event type.
 * @param {string} triggerType - Enum from Automation Model
 * @param {object} recipient - { email, userId (optional), name }
 * @param {object} data - Data for template replacement (e.g., order_number, checkout_url)
 * @param {object} options - { attachments: [], context: { orderId, sessionId } }
 */
const triggerAutomation = async (triggerType, recipient, data, options = {}) => {
    try {
        // 1. Check if Automation is Active
        let automation = await Automation.findOne({ triggerType }).populate('templateId');

        // Auto-create if missing (Self-Healing)
        if (!automation) {
            const newTemplate = await EmailTemplate.create({
                name: `Default ${triggerType}`,
                type: triggerType,
                subject: defaultTemplates[triggerType]?.subject || 'Notification',
                body: defaultTemplates[triggerType]?.body || '<p>Default Content</p>',
                placeholders: Object.keys(data).map(k => `{${k}}`)
            });
            automation = await Automation.create({
                name: triggerType.replace(/_/g, ' '),
                triggerType,
                isActive: true, // Defaulting to TRUE so current system keeps working
                templateId: newTemplate._id
            });
            automation = await Automation.findById(automation._id).populate('templateId');
        }

        if (!automation.isActive) {
            console.log(`Automation ${triggerType} is inactive. Skipping.`);
            return { skipped: true };
        }

        const template = automation.templateId;
        if (!template) {
            // Fallback to default if template DB entry is broken but logic exists
            console.error(`Template missing for automation ${triggerType}`);
            return { error: 'Template missing' };
        }

        // 2. Compile Content
        const subject = compileTemplate(template.subject, data);
        const html = compileTemplate(template.body, data);

        // 3. Send Email
        const result = await sendEmail({
            to: recipient.email,
            subject,
            html,
            attachments: options.attachments || []
        });

        // 4. Log
        await AutomationLog.create({
            automationId: automation._id,
            triggerType,
            recipientEmail: recipient.email,
            recipientUserId: recipient.userId,
            relatedOrderId: options.context?.orderId,
            relatedSessionId: options.context?.sessionId,
            status: result.success ? 'SENT' : 'FAILED',
            sentAt: new Date()
        });

        return result;

    } catch (error) {
        console.error(`Automation Error [${triggerType}]:`, error);
        return { error };
    }
};

module.exports = {
    sendEmail,
    triggerAutomation
};
