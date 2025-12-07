
const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema({
    name: { type: String, required: true }
});

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    subcategories: [SubcategorySchema]
});

CategorySchema.set('toJSON', { virtuals: true });

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;