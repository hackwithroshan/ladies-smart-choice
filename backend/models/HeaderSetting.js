
const mongoose = require('mongoose');

const HeaderLinkSchema = new mongoose.Schema({
    text: String,
    url: String,
});

const HeaderSettingSchema = new mongoose.Schema({
    logoText: String,
    logoUrl: String,
    brandColor: String,
    phoneNumber: String,
    topBarLinks: [HeaderLinkSchema],
    mainNavLinks: [HeaderLinkSchema],
});

const HeaderSetting = mongoose.model('HeaderSetting', HeaderSettingSchema);
module.exports = HeaderSetting;
