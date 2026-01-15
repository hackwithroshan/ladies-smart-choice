
const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
    id: { type: String, required: true }, // unique internal id
    type: { 
        type: String, 
        enum: ['Hero', 'Collections', 'NewArrivals', 'BestSellers', 'Videos', 'Testimonials', 'Newsletter', 'CustomCode'],
        required: true 
    },
    title: String,
    isActive: { type: Boolean, default: true },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    code: { type: String, default: '' }, // For CustomCode type
    settingsJson: { type: String, default: '' }, // NEW: Shopify-like Schema JSON
});

const HomepageLayoutSchema = new mongoose.Schema({
    sections: [SectionSchema]
}, { timestamps: true });

module.exports = mongoose.model('HomepageLayout', HomepageLayoutSchema);
