
const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['Percentage', 'Flat', 'Free Shipping'], required: true },
  value: { type: Number, required: function() { return this.type !== 'Free Shipping'; } },
  usageCount: { type: Number, default: 0 },
  maxUsage: { type: Number, required: true },
  expiry: { type: Date, required: true },
}, { timestamps: true });

DiscountSchema.set('toJSON', { virtuals: true });

const Discount = mongoose.model('Discount', DiscountSchema);
module.exports = Discount;
