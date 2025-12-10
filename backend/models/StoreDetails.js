
const mongoose = require('mongoose');

const StoreDetailsSchema = new mongoose.Schema({
    storeName: { type: String, default: 'Ladies Smart Choice' },
    logoUrl: String,
    faviconUrl: String,
    shortDescription: String,
    longDescription: String,
    businessType: { type: String, enum: ['Individual', 'Company'], default: 'Individual' },
    ownerName: String,
    contactEmail: { type: String, default: 'support@example.com' },
    contactPhone: { type: String, default: '+91 00000 00000' },
    address: { type: String, default: '123 Business Avenue, City, State, 110001' },
    gstin: String,
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en-IN' },
});

const StoreDetails = mongoose.model('StoreDetails', StoreDetailsSchema);
module.exports = StoreDetails;
