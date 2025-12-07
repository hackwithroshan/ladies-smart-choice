
const mongoose = require('mongoose');

const ContentPageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['Published', 'Hidden'], default: 'Hidden' },
}, { timestamps: true });

ContentPageSchema.pre('validate', function(next) {
    if (this.title && !this.slug) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

ContentPageSchema.set('toJSON', { virtuals: true });

const ContentPage = mongoose.model('ContentPage', ContentPageSchema);
module.exports = ContentPage;
