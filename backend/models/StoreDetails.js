
const mongoose = require('mongoose');

const StoreDetailsSchema = new mongoose.Schema({
    storeName: { type: String, default: 'Ayushree Ayurveda' },
    logoUrl: String,
    faviconUrl: String,
    businessType: { type: String, enum: ['Individual', 'Company'], default: 'Individual' },
    ownerName: String,
    contactEmail: { type: String, default: 'support@ayushree.com' },
    contactPhone: { type: String, default: '+91 987 654 3210' },
    address: { type: String, default: '123 Herbal Lane, Kerala, India' },
    legalName: String,
    companyEmail: String,
    companyPhone: String,
    websiteUrl: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    zipCode: String,
    gstin: String,
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en-IN' },
});

module.exports = mongoose.model('StoreDetails', StoreDetailsSchema);
