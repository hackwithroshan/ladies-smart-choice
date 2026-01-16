const mongoose = require('mongoose');

const AutomationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    triggerType: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'ABANDONED_CHECKOUT',
            'ORDER_CONFIRMATION',
            'INVOICE',
            'ORDER_SHIPPED',
            'WELCOME_USER',
            'FORGOT_PASSWORD'
        ]
    },
    isActive: { type: Boolean, default: false },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
    // Stats are aggregated on the fly from AutomationLog, but we can cache for speed if needed.
    // We will stick to real-time aggregation for "Real Data".
}, { timestamps: true });

module.exports = mongoose.model('Automation', AutomationSchema);
