
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all categories (Flat list for Admin table)
router.get('/', protect, admin, async (req, res) => {
    try {
        const categories = await Category.find({})
            .populate('parentId', 'name')
            .sort({ displayOrder: 1, name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get Category Tree (For nested selectors)
router.get('/tree', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).lean();
        const buildTree = (items, parentId = null) => {
            return items
                .filter(item => String(item.parentId) === (parentId ? String(parentId) : 'null'))
                .map(item => ({
                    ...item,
                    children: buildTree(items, item._id)
                }));
        };
        res.json(buildTree(categories));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Create category
router.post('/', protect, admin, async (req, res) => {
    try {
        const category = new Category(req.body);
        const saved = await category.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Update category
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Delete category (With dependency check)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const hasChildren = await Category.exists({ parentId: req.params.id });
        if (hasChildren) {
            return res.status(400).json({ message: "Terminate sub-categories before purging this node." });
        }
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category purged successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
