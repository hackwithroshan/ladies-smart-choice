
const mongoose = require('mongoose');

// Base Link Schema
const SubLinkSchema = new mongoose.Schema({
    text: String,
    url: String
}, { _id: false });

// Mega Menu Column Schema
const MegaMenuColumnSchema = new mongoose.Schema({
    title: String,
    links: [SubLinkSchema]
}, { _id: false });

// Main Navigation Link Schema
const HeaderLinkSchema = new mongoose.Schema({
    text: String,
    url: String,
    isSpecial: { type: Boolean, default: false },
    
    // Switch between 'Mega' (Full Width) and 'Standard' (Dropdown)
    isMegaMenu: { type: Boolean, default: false },

    // Data Container for Standard Dropdown
    subLinks: [SubLinkSchema],

    // Data Container for Mega Menu
    megaColumns: [MegaMenuColumnSchema] 
});

const HeaderSettingSchema = new mongoose.Schema({
    logoText: String,
    logoUrl: String,
    brandColor: String,
    phoneNumber: String,
    
    // Announcement Bar
    announcementMessage: { type: String, default: 'Largest selection of sneakers, boots and athleisure.' }, 
    announcementMessages: { type: [String], default: ['Largest selection of sneakers, boots and athleisure.'] }, 
    
    announcementBgColor: { type: String, default: '#E1B346' }, 
    announcementTextColor: { type: String, default: '#FFFFFF' },

    topBarLinks: [HeaderLinkSchema],
    mainNavLinks: [HeaderLinkSchema],
});

const HeaderSetting = mongoose.model('HeaderSetting', HeaderSettingSchema);
module.exports = HeaderSetting;
