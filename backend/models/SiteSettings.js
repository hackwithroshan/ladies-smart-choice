
const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    videoAutoplay: { type: Boolean, default: true },
    
    // Branding
    fontFamily: { type: String, default: 'Montserrat' }, // Default font

    // Meta Pixel & CAPI Settings
    metaPixelId: String, // Consolidated from facebookPixelId
    metaAccessToken: String,
    metaCatalogId: String,

    // Event Tracking Toggles
    trackPageView: { type: Boolean, default: true },
    trackViewContent: { type: Boolean, default: true },
    trackAddToCart: { type: Boolean, default: true },
    trackInitiateCheckout: { type: Boolean, default: true },
    trackPurchase: { type: Boolean, default: true },
});

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
module.exports = SiteSettings;
