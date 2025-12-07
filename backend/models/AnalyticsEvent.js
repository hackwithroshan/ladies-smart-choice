
const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
    eventType: { type: String, required: true },
    path: String,
    source: String,
    utm: {
        source: String,
        medium: String,
        campaign: String,
    },
    data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
module.exports = AnalyticsEvent;
