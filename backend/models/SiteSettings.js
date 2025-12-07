
const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    videoAutoplay: { type: Boolean, default: true },
    
    // Meta Pixel & CAPI Settings
    metaPixelId: String, // Consolidated from facebookPixelId
    metaAccessToken: String,
    metaCatalogId: String,
});

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
module.exports = SiteSettings;
