
const mongoose = require('mongoose');

const ShoppableVideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: String,
    price: String, // String to allow "₹1,499" or "New Arrival"
    productLink: String, // Can be a slug or full URL
    targets: [{
        type: { type: String, enum: ['product', 'category', 'custom'] },
        id: String, // Product slug, Category ID, or URL path
        name: String,
    }],
    sortOrder: { type: Number, default: 0 },
});

ShoppableVideoSchema.set('toJSON', { virtuals: true });

const ShoppableVideo = mongoose.model('ShoppableVideo', ShoppableVideoSchema);
module.exports = ShoppableVideo;
