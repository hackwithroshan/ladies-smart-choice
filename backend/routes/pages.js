
const express = require('express');
const router = express.Router();
const ContentPage = require('../models/ContentPage');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all pages (admin) or only published (public)
router.get('/', async (req, res) => {
    const query = (req.query.admin === 'true' && req.user && req.user.isAdmin) ? {} : { status: 'Published' };
    const pages = await ContentPage.find(query).sort({ title: 1 });
    res.json(pages);
});

// Get single page by slug
router.get('/:slug', async (req, res) => {
    const page = await ContentPage.findOne({ slug: req.params.slug });
    if (page && (page.status === 'Published' || (req.user && req.user.isAdmin))) {
        res.json(page);
    } else {
        res.status(404).json({ message: 'Page not found' });
    }
});

// Create new page
router.post('/', protect, admin, async (req, res) => {
    const newPage = new ContentPage(req.body);
    const saved = await newPage.save();
    res.status(201).json(saved);
});

// Update page
router.put('/:id', protect, admin, async (req, res) => {
    const updated = await ContentPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

// Delete page
router.delete('/:id', protect, admin, async (req, res) => {
    await ContentPage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Page deleted' });
});

module.exports = router;
