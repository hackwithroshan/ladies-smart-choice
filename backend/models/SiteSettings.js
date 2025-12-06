
const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    facebookPixelId: String,
    googlePixelId: String, // For GA4 etc.
    videoAutoplay: { type: Boolean, default: true },
    // Meta CAPI & Catalog
    metaAccessToken: String,
    metaCatalogId: String,
});

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
module.exports = SiteSettings;
