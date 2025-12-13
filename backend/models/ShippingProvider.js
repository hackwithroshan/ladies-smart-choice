
const mongoose = require('mongoose');

const ShippingProviderSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true }, // e.g., 'shiprocket', 'delhivery'
    name: { type: String, required: true },
    logoUrl: String,
    isEnabled: { type: Boolean, default: false },
    isTestMode: { type: Boolean, default: false },
    credentials: {
        // Flexible schema to store different keys for different providers
        apiKey: String,
        apiSecret: String,
        token: String,
        merchantId: String,
        username: String,
        password: String, // Note: In a real app, encrypt this field
    },
    settings: {
        autoShip: { type: Boolean, default: false }, // Automatically push order to courier on 'Packed'
        defaultPickupLocation: String,
    }
}, { timestamps: true });

const ShippingProvider = mongoose.model('ShippingProvider', ShippingProviderSchema);
module.exports = ShippingProvider;
