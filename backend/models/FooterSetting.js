
const mongoose = require('mongoose');

const FooterLinkSchema = new mongoose.Schema({
    text: String,
    url: String,
});

const FooterColumnSchema = new mongoose.Schema({
    title: String,
    links: [FooterLinkSchema],
});

const SocialLinkSchema = new mongoose.Schema({
    platform: String,
    url: String,
});

const FooterSettingSchema = new mongoose.Schema({
    logoUrl: String, // New field for Footer Logo
    brandDescription: String,
    copyrightText: String,
    socialLinks: [SocialLinkSchema],
    columns: [FooterColumnSchema],
    
    // Background Styling
    backgroundColor: { type: String, default: '#881337' },
    backgroundImage: String,
    overlayColor: { type: String, default: '#000000' },
    overlayOpacity: { type: Number, default: 0 }, // 0 to 100
});

const FooterSetting = mongoose.model('FooterSetting', FooterSettingSchema);
module.exports = FooterSetting;
