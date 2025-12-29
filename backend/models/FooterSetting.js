
const mongoose = require('mongoose');

const FooterLinkSchema = new mongoose.Schema({
    text: String,
    url: String,
}, { _id: false });

const FooterColumnSchema = new mongoose.Schema({
    title: String,
    links: [FooterLinkSchema],
}, { _id: false });

const SocialLinkSchema = new mongoose.Schema({
    platform: String,
    url: String,
}, { _id: false });

const FooterSettingSchema = new mongoose.Schema({
    logoUrl: String,
    brandDescription: String,
    copyrightText: String,
    socialLinks: [SocialLinkSchema],
    columns: [FooterColumnSchema],
    
    // Global Styling & Live Colors
    backgroundColor: { type: String, default: '#16423C' },
    backgroundImage: String,
    overlayColor: { type: String, default: '#000000' },
    overlayOpacity: { type: Number, default: 0 },
    textColor: { type: String, default: '#D1D5DB' },
    headingColor: { type: String, default: '#6A9C89' },
    linkColor: { type: String, default: '#9CA3AF' },

    // Newsletter Logic
    showNewsletter: { type: Boolean, default: true },
    newsletterTitle: { type: String, default: 'Subscribe to our Wellness Journey' },
    newsletterSubtitle: { type: String, default: 'Get the latest Ayurvedic tips and early access to pure herbal launches.' },
    newsletterPlacement: { type: String, enum: ['Top', 'InColumn'], default: 'Top' }
}, { timestamps: true });

const FooterSetting = mongoose.model('FooterSetting', FooterSettingSchema);
module.exports = FooterSetting;
