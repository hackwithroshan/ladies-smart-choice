
const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all active collections with products
router.get('/', async (req, res) => {
    const collections = await Collection.find({ isActive: true }).populate('products');
    res.json(collections);
});

// Get a single collection by ID/slug with products
router.get('/:id', async (req, res) => {
    // Check if ID is a valid ObjectId, otherwise treat as slug
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

    const collection = await Collection.findOne(query).populate('products');
    if (collection) {
        res.json(collection);
    } else {
        res.status(404).json({ message: 'Collection not found' });
    }
});

// ADMIN: Get all collections
router.get('/admin', protect, admin, async (req, res) => {
    const collections = await Collection.find({}).populate('products');
    res.json(collections);
});

// ADMIN: Create new collection
router.post('/', protect, admin, async (req, res) => {
    const newCollection = new Collection(req.body);
    const saved = await newCollection.save();
    res.status(201).json(saved);
});

// ADMIN: Update collection
router.put('/:id', protect, admin, async (req, res) => {
    const updated = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

// ADMIN: Delete collection
router.delete('/:id', protect, admin, async (req, res) => {
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection deleted' });
});

module.exports = router;
