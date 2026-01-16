const mongoose = require('mongoose');

const AutomationLogSchema = new mongoose.Schema({
    automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation' },
    triggerType: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // If sale
    relatedSessionId: { type: String }, // For tracking session -> conversion
    status: { type: String, enum: ['SENT', 'FAILED', 'OPENED', 'CLICKED'], default: 'SENT' },
    sentAt: { type: Date, default: Date.now },
    converted: { type: Boolean, default: false }, // If they bought something after this email
    conversionValue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AutomationLog', AutomationLogSchema);
