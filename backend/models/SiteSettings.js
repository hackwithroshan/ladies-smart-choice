const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    // Core Identity
    storeName: { type: String, default: 'Ayushree Ayurveda' },
    logoUrl: String,
    faviconUrl: String,

    // Design System
    primaryColor: { type: String, default: '#16423C' },
    accentColor: { type: String, default: '#6A9C89' },
    fontFamily: { type: String, default: 'Playfair Display' },

    // STRICT CHECKOUT MODE
    checkoutMode: {
        type: String,
        enum: ['standard', 'magic'],
        default: 'standard'
    },

    // Commerce Settings
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    videoAutoplay: { type: Boolean, default: true },

    // WhatsApp Configuration
    whatsappNumber: { type: String, default: '919876543210' },
    whatsappMessage: { type: String, default: 'Namaste! I have a question about Ayushree products.' },

    // --- ADS INTEGRATIONS ---

    // Meta (Facebook & Instagram)
    metaPixelId: String,
    metaAccessToken: String,
    metaCatalogId: String,
    metaBusinessId: String,
    metaAdsConnected: { type: Boolean, default: false },
    metaLastSync: Date,

    // Google Ads
    googleAdsId: String, // AW-XXXXXXXX
    googleConversionLabel: String,
    googleMerchantId: String,
    googleAdsConnected: { type: Boolean, default: false },

    // Event Tracking Toggles
    trackPageView: { type: Boolean, default: true },
    trackViewContent: { type: Boolean, default: true },
    trackAddToCart: { type: Boolean, default: true },
    trackInitiateCheckout: { type: Boolean, default: true },
    trackPurchase: { type: Boolean, default: true },
});

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
module.exports = SiteSettings;
