
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String }
});

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: String,
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String,
        country: String,
    },
    trackingInfo: {
        carrier: String,
        trackingNumber: String,
    },
    date: { type: Date, default: Date.now },
    total: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'], 
        default: 'Pending' 
    },
    items: [OrderItemSchema],
    paymentInfo: {
        razorpay_payment_id: String,
        razorpay_order_id: String,
        razorpay_signature: String,
    }
});

OrderSchema.set('toJSON', { virtuals: true });

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
