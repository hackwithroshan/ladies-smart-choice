
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
    brandDescription: String,
    copyrightText: String,
    socialLinks: [SocialLinkSchema],
    columns: [FooterColumnSchema],
});

const FooterSetting = mongoose.model('FooterSetting', FooterSettingSchema);
module.exports = FooterSetting;
