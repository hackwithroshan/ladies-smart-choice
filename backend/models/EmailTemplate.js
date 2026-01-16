const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Abandoned Checkout - Default"
    type: {
        type: String,
        required: true,
        enum: [
            'ABANDONED_CHECKOUT',
            'ORDER_CONFIRMATION',
            'INVOICE',
            'ORDER_SHIPPED',
            'WELCOME_USER',
            'FORGOT_PASSWORD',
            'PASSWORD_RESET_SUCCESS'
        ]
    },
    subject: { type: String, required: true },
    body: { type: String, required: true }, // HTML content
    placeholders: [{ type: String }], // e.g., ['{customer_name}', '{order_total}']
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
