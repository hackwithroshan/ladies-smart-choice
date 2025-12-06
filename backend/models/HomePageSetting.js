
const mongoose = require('mongoose');

const HomePageSettingSchema = new mongoose.Schema({
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
});

const HomePageSetting = mongoose.model('HomePageSetting', HomePageSettingSchema);
module.exports = HomePageSetting;
