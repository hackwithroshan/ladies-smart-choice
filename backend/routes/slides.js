
const express = require('express');
const router = express.Router();
const Slide = require('../models/Slide');
const { protect, admin } = require('../middleware/authMiddleware');

// GET all slides
router.get('/', async (req, res) => {
    const slides = await Slide.find({});
    res.json(slides);
});

// POST a new slide
router.post('/', protect, admin, async (req, res) => {
    const newSlide = new Slide(req.body);
    const savedSlide = await newSlide.save();
    res.status(201).json(savedSlide);
});

// PUT update a slide
router.put('/:id', protect, admin, async (req, res) => {
    const updatedSlide = await Slide.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedSlide);
});

// DELETE a slide
router.delete('/:id', protect, admin, async (req, res) => {
    await Slide.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slide deleted' });
});

module.exports = router;
