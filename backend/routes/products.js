
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Collection = require('../models/Collection');
const ActivityLog = require('../models/ActivityLog');
const { protect, admin } = require('../middleware/authMiddleware');

// Helper to log admin actions
const logAction = async (req, action, target, targetId, details) => {
    try {
        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action,
            target,
            targetId,
            details,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (e) { console.error("Logging failed", e); }
};

// @desc    Get all products (Admin)
// @route   GET /api/products/all
router.get('/all', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// @desc    Get single product by ID (Admin)
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Record ID format' });
        }
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Record not found' });
        res.json(product);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Record not found' });
        await logAction(req, 'updated', 'Product', updated._id, `Modified master record: ${updated.name}`);
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Duplicate Slug or SKU detected.' });
        res.status(400).json({ message: err.message });
    }
});

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const p = await Product.findByIdAndDelete(req.params.id);
        if (!p) return res.status(404).json({ message: 'Record not found' });
        await logAction(req, 'deleted', 'Product', req.params.id, `Terminated record: ${p.name}`);
        res.json({ message: 'Record purged successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// @desc    Create product (Admin)
// @route   POST /api/products
router.post('/', protect, admin, async (req, res) => {
    try {
        const product = new Product(req.body);
        const saved = await product.save();
        await logAction(req, 'created', 'Product', saved._id, `Initialized record: ${saved.name}`);
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Duplicate Slug or SKU detected.' });
        res.status(400).json({ message: err.message });
    }
});

// --- Public Access Routes ---

router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/slug/:slug', async (req, res) => {
    try {
        const p = await Product.findOne({ slug: req.params.slug });
        if (!p) return res.status(404).json({ message: 'Not found' });
        res.json(p);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const filter = { status: 'Active', $or: [{ name: { $regex: q, $options: 'i' } }, { tags: { $regex: q, $options: 'i' } }] };
        const results = await Product.find(filter).limit(10);
        res.json(results);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Category/Collection Management (Admin Interface) ---

router.get('/categories', async (req, res) => {
    try {
        const collections = await Collection.find({}).sort({ title: 1 });
        res.json(collections.map(c => ({ id: c._id, name: c.title })));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/categories', protect, admin, async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await Collection.findOne({ title: name });
        if (exists) return res.status(400).json({ message: "Category exists" });
        const c = new Collection({ title: name, isActive: true });
        await c.save();
        res.status(201).json({ id: c._id, name: c.title });
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/categories/:id', protect, admin, async (req, res) => {
    try {
        await Collection.findByIdAndDelete(req.params.id);
        res.json({ message: 'Purged' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
