
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // userId is now optional for Guest Checkout
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    items: [{
        productId: { type: String },
        name: { type: String },
        quantity: { type: Number },
        price: { type: Number }
    }],
    total: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Paid', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    paymentId: { type: String },
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String,
        country: { type: String, default: 'India' }
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
