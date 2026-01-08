
const express = require('express');
const router = express.Router();
const ShoppableVideo = require('../models/ShoppableVideo');
const Testimonial = require('../models/Testimonial');
const { protect, admin } = require('../middleware/authMiddleware');

// --- Shoppable Videos CRUD ---

// @desc    Get all videos
router.get('/videos', async (req, res) => {
    try {
        const videos = await ShoppableVideo.find({}).sort({ sortOrder: 1, createdAt: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve videos' });
    }
});

// @desc    Create a video
router.post('/videos', protect, admin, async (req, res) => {
    try {
        const newVideo = new ShoppableVideo(req.body);
        const saved = await newVideo.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Validation failed' });
    }
});

// @desc    Update a video
router.put('/videos/:id', protect, admin, async (req, res) => {
    try {
        const updated = await ShoppableVideo.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Video not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Update failed' });
    }
});

// @desc    Delete a video
router.delete('/videos/:id', protect, admin, async (req, res) => {
    try {
        const deleted = await ShoppableVideo.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Video not found' });
        res.json({ message: 'Video entry purged' });
    } catch (err) {
        res.status(500).json({ message: 'Deletion failed' });
    }
});

// --- Testimonials CRUD ---
router.get('/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
});

router.post('/testimonials', protect, admin, async (req, res) => {
    try {
        const newTestimonial = new Testimonial(req.body);
        await newTestimonial.save();
        res.status(201).json(newTestimonial);
    } catch (err) {
        res.status(400).json({ message: 'Failed to save testimonial' });
    }
});

router.delete('/testimonials/:id', protect, admin, async (req, res) => {
    try {
        await Testimonial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Deletion failed' });
    }
});

module.exports = router;
