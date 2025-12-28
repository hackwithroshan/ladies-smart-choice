
const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  mobileImageUrl: { type: String }, // Optional mobile specific image
  title: String,
  subtitle: String,
  buttonText: String,
  imageFit: { type: String, enum: ['cover', 'contain', 'fill'], default: 'cover' },
  desktopHeight: { type: String, default: '650px' },
  mobileHeight: { type: String, default: '400px' },
  desktopWidth: { type: String, default: '100%' },
  mobileWidth: { type: String, default: '100%' }
});

SlideSchema.set('toJSON', { virtuals: true });

const Slide = mongoose.model('Slide', SlideSchema);
module.exports = Slide;
