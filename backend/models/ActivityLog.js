
const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    action: { type: String, required: true },
    target: String, // e.g., 'Product', 'Order'
    targetId: String,
    details: String,
    ip: String,
    userAgent: String,
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
