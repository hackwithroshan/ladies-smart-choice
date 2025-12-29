
const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    imageUrl: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    displayStyle: { type: String, enum: ['Rectangle', 'Square', 'Circle', 'ImageOnly'], default: 'Rectangle' }
});

CollectionSchema.pre('validate', function(next) {
    if (this.title && !this.slug) {
        // Robust slugifier: handles special characters and collapses multiple hyphens into one
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    next();
});

CollectionSchema.set('toJSON', { virtuals: true });

const Collection = mongoose.model('Collection', CollectionSchema);
module.exports = Collection;
