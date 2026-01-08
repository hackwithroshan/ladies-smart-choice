
const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
    eventType: { 
        type: String, 
        required: true, 
        enum: ['PageView', 'AddToCart', 'InitiateCheckout', 'Purchase', 'TestEvent'] 
    },
    path: String,
    source: String, // meta, google, direct, organic
    domain: String,
    eventId: String,
    data: {
        value: Number,
        currency: String,
        items: Array,
        productId: String,
        email: String
    },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexing for performance
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsEventSchema.index({ source: 1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
