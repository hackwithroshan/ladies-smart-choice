
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String }
});

const OrderSchema = new mongoose.Schema({
    orderNumber: { type: Number, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    
    // Structured for Shiprocket/Delhivery compatibility
    shippingAddress: {
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' },
    },
    
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    
    // Razorpay Specifics
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    paymentMethod: { type: String },
    
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
