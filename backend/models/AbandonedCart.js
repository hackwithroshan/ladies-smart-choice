
const mongoose = require('mongoose');

const AbandonedCartSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phone: String,
    name: String,
    items: [{
        productId: String,
        name: String,
        quantity: Number,
        price: Number
    }],
    total: Number,
    razorpayOrderId: String,
    status: { type: String, default: 'Abandoned' }, // Abandoned, Recovered
    lastAttempt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AbandonedCart', AbandonedCartSchema);
