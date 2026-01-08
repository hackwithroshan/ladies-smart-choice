
const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['Percentage', 'Flat'], required: true },
  value: { type: Number, required: true },
  
  // Scoping Logic
  scope: { 
    type: String, 
    enum: ['Cart', 'Product', 'Category'], 
    default: 'Cart' 
  },
  scopeIds: [{ type: String }], // IDs of products or categories
  
  // Constraints
  minOrderValue: { type: Number, default: 0 },
  maxDiscountLimit: { type: Number }, // Max ₹ off for percentage discounts
  
  // Scheduling
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  
  // Limits
  usageCount: { type: Number, default: 0 },
  maxUsage: { type: Number, default: 1000 },
  usageLimitPerUser: { type: Number, default: 1 },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

DiscountSchema.set('toJSON', { virtuals: true });

const Discount = mongoose.model('Discount', DiscountSchema);
module.exports = Discount;
