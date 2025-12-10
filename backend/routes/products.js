
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---

// NEW: Search products
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = req.query.category || '';

        // Build the filter object
        const filter = {
            status: 'Active',
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { shortDescription: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } },
            ],
        };

        // Add category to filter if it exists
        if (category) {
            filter.category = category;
        }

        const products = await Product.find(filter).limit(5); // Limit to 5 results for dropdown
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET multiple featured (random) products
router.get('/featured', async (req, res) => {
    try {
        // Use aggregation pipeline to efficiently get multiple random documents
        const products = await Product.aggregate([
            { $match: { status: 'Active' } },
            { $sample: { size: 4 } }
        ]);
        if (!products.length) {
            return res.status(404).json({ message: 'No active products found to feature' });
        }
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// GET all active products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET product by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- ADMIN ROUTES ---

// GET all products (including drafts)
router.get('/all', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new product
router.post('/', protect, admin, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
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
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new category
router.post('/categories', protect, admin, async (req, res) => {
    try {
        const newCategory = new Category({ name: req.body.name, subcategories: [] });
        const saved = await newCategory.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a category
router.delete('/categories/:id', protect, admin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a review
router.post('/:id/reviews', protect, async (req, res) => {
    const { rating, comment, imageUrl } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        // Check if user already reviewed
        const alreadyReviewed = product.reviews.find(
            r => r.userId && r.userId.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            userId: req.user._id,
            imageUrl,
            date: new Date()
        };
        product.reviews.unshift(review); // Add to the beginning of the array
        await product.save();
        // Return the newly created review with its generated ID
        res.status(201).json(product.reviews[0]);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});


module.exports = router;
