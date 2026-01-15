
const mongoose = require('mongoose');

const AbandonedCartSchema = new mongoose.Schema({
    checkoutId: { type: Number }, // Numeric ID for admin display
    email: { type: String },
    phone: String,
    name: String,
    items: [{
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
        imageUrl: String
    }],
    total: Number,
    razorpayOrderId: String,
    status: { type: String, default: 'Abandoned' }, // Abandoned, Recovered
    lastAttempt: { type: Date, default: Date.now },
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String,
        country: { type: String, default: 'India' }
    }
}, { timestamps: true });

module.exports = mongoose.model('AbandonedCart', AbandonedCartSchema);
