
const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Email', 'SMS', 'WhatsApp', 'Push'], required: true },
  status: { type: String, enum: ['Draft', 'Scheduled', 'Sent'], default: 'Draft' },
  sentCount: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 },
  clickRate: { type: Number, default: 0 },
}, { timestamps: true });

CampaignSchema.set('toJSON', { virtuals: true });

const Campaign = mongoose.model('Campaign', CampaignSchema);
module.exports = Campaign;
