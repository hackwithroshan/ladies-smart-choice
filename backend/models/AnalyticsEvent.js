
const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
    eventType: { type: String, required: true },
    sessionId: { type: String, index: true },
    path: String,
    source: String,
    utm: {
        source: String,
        medium: String,
        campaign: String,
    },
    device: {
        deviceType: String, // Renamed from `type` to avoid Mongoose conflict
        browser: String,
        os: String
    },
    location: {
        country: String,
        state: String,
        city: String,
        area: String, // Added for detailed location tracking
        ip: String
    },
    referrerUrl: String,
    landingPage: String, // Mark if this path was landing
    data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
module.exports = AnalyticsEvent;
