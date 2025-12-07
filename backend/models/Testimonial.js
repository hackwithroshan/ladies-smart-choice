
const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: String, // e.g., "Verified Customer"
    comment: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    imageUrl: String,
});

TestimonialSchema.set('toJSON', { virtuals: true });

const Testimonial = mongoose.model('Testimonial', TestimonialSchema);
module.exports = Testimonial;
