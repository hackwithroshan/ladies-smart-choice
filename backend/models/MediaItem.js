
const mongoose = require('mongoose');

const MediaItemSchema = new mongoose.Schema({
    url: { type: String, required: true },
    public_id: { type: String, required: true }, // For Cloudinary or other services
    format: String,
    type: { type: String, enum: ['image', 'video'], required: true },
}, { timestamps: true });

MediaItemSchema.set('toJSON', { virtuals: true });

const MediaItem = mongoose.model('MediaItem', MediaItemSchema);
module.exports = MediaItem;
