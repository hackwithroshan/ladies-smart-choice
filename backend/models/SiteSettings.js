
const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    videoAutoplay: { type: Boolean, default: true },
    
    // Maintenance Mode
    isMaintenanceMode: { type: Boolean, default: false },
    
    // WhatsApp Configuration
    whatsappNumber: { type: String, default: '919876543210' },
    whatsappMessage: { type: String, default: 'Hi, I need help with my order.' },

    // Branding
    fontFamily: { type: String, default: 'Montserrat' }, // Default font

    // Meta Pixel & CAPI Settings
    metaPixelId: String, 
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
