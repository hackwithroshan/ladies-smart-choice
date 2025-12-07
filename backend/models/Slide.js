
const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: String,
  subtitle: String,
  buttonText: String,
});

SlideSchema.set('toJSON', { virtuals: true });

const Slide = mongoose.model('Slide', SlideSchema);
module.exports = Slide;
