
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Collection = require('../models/Collection'); // Changed from Category to Collection
const Order = require('../models/Order');
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

// POST a new product
router.post('/', protect, admin, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        await logAction(req, 'created', 'Product', savedProduct._id, `Added new product: ${savedProduct.name}`);
        res.status(201).json(savedProduct);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `A product with this ${field} already exists.` });
        }
        res.status(400).json({ message: err.message });
    }
});

// PUT update a product
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        await logAction(req, 'updated', 'Product', updatedProduct._id, `Modified product details for ${updatedProduct.name}`);
        res.json(updatedProduct);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `Another product already uses this ${field}.` });
        }
        res.status(400).json({ message: err.message });
    }
});

// DELETE a product
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await logAction(req, 'deleted', 'Product', req.params.id, `Removed product: ${product.name}`);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = req.query.category || '';
        const filter = {
            status: 'Active',
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { shortDescription: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } },
            ],
        };
        if (category) filter.category = category;
        const products = await Product.find(filter).limit(5);
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/featured', async (req, res) => {
    try {
        const products = await Product.aggregate([{ $match: { status: 'Active' } }, { $sample: { size: 4 } }]);
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/frequently-bought-together', async (req, res) => {
    try {
        const productId = req.params.id;
        const recommendations = await Order.aggregate([
            { $match: { 'items.productId': new mongoose.Types.ObjectId(productId) } },
            { $unwind: '$items' },
            { $match: { 'items.productId': { $ne: new mongoose.Types.ObjectId(productId) } } },
            { $group: { _id: '$items.productId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 2 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDetails' } },
            { $unwind: '$productDetails' },
            { $replaceRoot: { newRoot: '$productDetails' } },
            { $match: { status: 'Active' } }
        ]);
        if (recommendations.length < 2) {
            const currentProduct = await Product.findById(productId);
            if (currentProduct) {
                const existingIds = [productId, ...recommendations.map(r => r._id.toString())];
                const filler = await Product.find({ category: currentProduct.category, _id: { $nin: existingIds }, status: 'Active' }).limit(2 - recommendations.length);
                recommendations.push(...filler);
            }
        }
        res.json(recommendations);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' });
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// @desc    Get all categories (Synchronized with Collections)
// @route   GET /api/products/categories
router.get('/categories', async (req, res) => {
    try {
        // Fetch all collections and map them to the expected category format
        const collections = await Collection.find({}).sort({ title: 1 });
        const categories = collections.map(col => ({
            id: col._id,
            name: col.title,
            imageUrl: col.imageUrl,
            isActive: col.isActive
        }));
        res.json(categories);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// @desc    Add a new category (Creates a new Collection)
// @route   POST /api/products/categories
router.post('/categories', protect, admin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Category name is required." });

        const existing = await Collection.findOne({ title: name });
        if (existing) return res.status(400).json({ message: "Category/Collection already exists." });

        const newCollection = new Collection({
            title: name,
            isActive: true,
            displayStyle: 'Rectangle'
        });
        
        await newCollection.save();
        res.status(201).json({ id: newCollection._id, name: newCollection.title });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Delete a category (Deletes the Collection)
// @route   DELETE /api/products/categories/:id
router.delete('/categories/:id', protect, admin, async (req, res) => {
    try {
        await Collection.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category/Collection removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/all', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
