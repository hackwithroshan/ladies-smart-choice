
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        default: null 
    },
    description: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true },
    // SEO Architecture
    seoTitle: String,
    seoDescription: String,
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Robust Auto-slugifier
CategorySchema.pre('validate', function(next) {
    if (this.name && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    next();
});

module.exports = mongoose.model('Category', CategorySchema);
