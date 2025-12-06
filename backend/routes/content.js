
const express = require('express');
const router = express.Router();
const ShoppableVideo = require('../models/ShoppableVideo');
const Testimonial = require('../models/Testimonial');
const { protect, admin } = require('../middleware/authMiddleware');

// --- Videos ---
router.get('/videos', async (req, res) => {
    const videos = await ShoppableVideo.find({}).sort({ sortOrder: 1 });
    res.json(videos);
});

router.post('/videos', protect, admin, async (req, res) => {
    const newVideo = new ShoppableVideo(req.body);
    await newVideo.save();
    res.status(201).json(newVideo);
});

router.put('/videos/:id', protect, admin, async (req, res) => {
    const updated = await ShoppableVideo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

router.delete('/videos/:id', protect, admin, async (req, res) => {
    await ShoppableVideo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});


// --- Testimonials ---
router.get('/testimonials', async (req, res) => {
    const testimonials = await Testimonial.find({});
    res.json(testimonials);
});

router.post('/testimonials', protect, admin, async (req, res) => {
    const newTestimonial = new Testimonial(req.body);
    await newTestimonial.save();
    res.status(201).json(newTestimonial);
});

router.delete('/testimonials/:id', protect, admin, async (req, res) => {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

module.exports = router;
