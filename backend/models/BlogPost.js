
const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: String,
    imageUrl: String,
    author: String,
    status: { type: String, enum: ['Published', 'Draft'], default: 'Draft' },
}, { timestamps: true });

BlogPostSchema.pre('validate', function(next) {
    if (this.title && !this.slug) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

BlogPostSchema.set('toJSON', { virtuals: true });

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
module.exports = BlogPost;
