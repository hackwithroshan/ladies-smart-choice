
const express = require('express');
const router = express.Router();
const MediaItem = require('../models/MediaItem');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, async (req, res) => {
    const media = await MediaItem.find({}).sort({ createdAt: -1 });
    res.json(media);
});

router.post('/', protect, admin, async (req, res) => {
    const newItem = new MediaItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
});

router.delete('/:id', protect, admin, async (req, res) => {
    // Note: This only deletes the DB record. Deleting from Cloudinary would require their SDK.
    await MediaItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Media deleted from library' });
});

module.exports = router;
