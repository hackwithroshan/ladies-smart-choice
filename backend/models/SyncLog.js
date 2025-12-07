
const mongoose = require('mongoose');

const SyncLogSchema = new mongoose.Schema({
    service: { type: String, required: true }, // e.g., 'meta-catalog'
    status: { type: String, enum: ['success', 'failed', 'in_progress'], required: true },
    processedCount: { type: Number, default: 0 },
    error: String,
}, { timestamps: { createdAt: 'timestamp' } });

const SyncLog = mongoose.model('SyncLog', SyncLogSchema);
module.exports = SyncLog;
