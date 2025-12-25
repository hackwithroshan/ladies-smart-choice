
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
  imageUrl: String,
});

const VariantOptionSchema = new mongoose.Schema({
  value: String,
  price: Number,
  stock: Number,
  image: String,
});

const VariantSchema = new mongoose.Schema({
  name: String,
  options: [VariantOptionSchema],
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: String,
  brand: String,
  sku: { type: String, unique: true, sparse: true },
  barcode: String,
  category: { type: String, required: true },
  subCategory: String,
  tags: [String],
  status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active' },
  price: { type: Number, required: true },
  mrp: Number,
  costPrice: Number,
  taxRate: Number,
  stock: { type: Number, required: true, default: 0 },
  lowStockThreshold: Number,
  allowBackorders: Boolean,
  imageUrl: { type: String, required: true },
  galleryImages: [String],
  videoUrl: String,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  hasVariants: Boolean,
  variants: [VariantSchema],
  reviews: [ReviewSchema],
}, { timestamps: true });

// Ensure slug and sku are generated if not provided
ProductSchema.pre('validate', function(next) {
    if (this.name && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    
    // Auto-generate SKU if missing
    if (!this.sku) {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.sku = `AYU-${randomStr}-${timestamp}`;
    }
    
    next();
});

ProductSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
