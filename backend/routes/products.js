
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
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

// ... (previous routes) ...

// POST a new product
router.post('/', protect, admin, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        await logAction(req, 'created', 'Product', savedProduct._id, `Added new product: ${savedProduct.name}`);
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update a product
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        await logAction(req, 'updated', 'Product', updatedProduct._id, `Modified product details for ${updatedProduct.name}`);
        res.json(updatedProduct);
    } catch (err) {
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

// Reuse the rest of the routes as provided in original context
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

router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/all', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
