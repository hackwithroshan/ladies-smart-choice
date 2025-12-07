
const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all active collections with products
router.get('/', async (req, res) => {
    try {
        const collections = await Collection.find({ isActive: true }).populate('products');
        res.json(collections);
    } catch (err) {
        console.error("Error fetching public collections:", err);
        res.status(500).json({ message: "Server error while fetching collections" });
    }
});

// ADMIN: Get all collections (renamed from /admin to avoid conflict with /:id)
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const collections = await Collection.find({}).populate('products');
        res.json(collections);
    } catch (err) {
        console.error("Error fetching admin collections:", err);
        res.status(500).json({ message: "Server error while fetching admin collections" });
    }
});

// Get a single collection by ID/slug with products
router.get('/:id', async (req, res) => {
    try {
        // Check if ID is a valid ObjectId, otherwise treat as slug
        const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
        const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

        const collection = await Collection.findOne(query).populate('products');
        if (collection) {
            res.json(collection);
        } else {
            res.status(404).json({ message: 'Collection not found' });
        }
    } catch (err) {
        console.error(`Error fetching collection by id/slug (${req.params.id}):`, err);
        res.status(500).json({ message: "Server error while fetching collection" });
    }
});


// ADMIN: Create new collection
router.post('/', protect, admin, async (req, res) => {
    try {
        const newCollection = new Collection(req.body);
        const saved = await newCollection.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("Error creating collection:", err);
        res.status(400).json({ message: err.message || "Failed to create collection" });
    }
});

// ADMIN: Update collection
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updated = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Collection not found." });
        res.json(updated);
    } catch (err) {
        console.error("Error updating collection:", err);
        res.status(400).json({ message: err.message || "Failed to update collection" });
    }
});

// ADMIN: Delete collection
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const deleted = await Collection.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Collection not found." });
        res.json({ message: 'Collection deleted' });
    } catch (err) {
        console.error("Error deleting collection:", err);
        res.status(500).json({ message: "Server error while deleting collection" });
    }
});

module.exports = router;
