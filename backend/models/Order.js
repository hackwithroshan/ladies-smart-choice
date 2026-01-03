
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // userId is now optional for Guest Checkout
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    orderNumber: { type: Number, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    
    // SOURCE TRACKING
    checkoutType: { 
        type: String, 
        enum: ['standard', 'magic'], 
        required: true,
        default: 'standard' // Fallback for legacy orders
    },

    items: [{
        productId: { type: String },
        name: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        imageUrl: { type: String }
    }],
    total: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Paid', 'Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], 
        default: 'Pending' 
    },
    paymentId: { type: String },
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String,
        country: { type: String, default: 'India' }
    },
    trackingInfo: {
        carrier: String,
        trackingNumber: String,
        estimatedDelivery: Date
    },
    trackingHistory: [{
        date: { type: Date, default: Date.now },
        status: String,
        location: String,
        message: String
    }],
    notes: String,
    date: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-increment order number logic
OrderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'orderNumber': -1 } });
        this.orderNumber = lastOrder && lastOrder.orderNumber ? lastOrder.orderNumber + 1 : 1001;
    }
    next();
});

module.exports = mongoose.model('Order', OrderSchema);
