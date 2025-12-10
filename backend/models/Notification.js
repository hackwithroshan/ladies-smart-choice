
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['NEW_ORDER', 'NEW_MESSAGE', 'LOW_STOCK'] },
    message: { type: String, required: true },
    link: { type: String, required: true }, // e.g., /admin?view=orders&id=...
    read: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.set('toJSON', { virtuals: true });

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
