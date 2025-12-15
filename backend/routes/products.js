
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order'); // Required for FBT logic
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

// NEW: Get Frequently Bought Together
router.get('/:id/frequently-bought-together', async (req, res) => {
    try {
        const productId = req.params.id;
        
        // MongoDB Aggregation to find products often ordered with the current product
        const recommendations = await Order.aggregate([
            // 1. Find all orders that contain this product
            { $match: { 'items.productId': new mongoose.Types.ObjectId(productId) } },
            
            // 2. Unwind items to process them individually
            { $unwind: '$items' },
            
            // 3. Filter out the original product itself
            { $match: { 'items.productId': { $ne: new mongoose.Types.ObjectId(productId) } } },
            
            // 4. Group by product ID and count occurrences
            { $group: { _id: '$items.productId', count: { $sum: 1 } } },
            
            // 5. Sort by most frequent
            { $sort: { count: -1 } },
            
            // 6. Limit to top 2
            { $limit: 2 },
            
            // 7. Lookup product details from products collection
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            
            // 8. Unwind the product details array (lookup returns array)
            { $unwind: '$productDetails' },
            
            // 9. Format output - Replace root with product details
            { $replaceRoot: { newRoot: '$productDetails' } },
            
            // 10. Only return Active products
            { $match: { status: 'Active' } }
        ]);

        // Fallback: If not enough data (less than 2), fill with related products from same category
        if (recommendations.length < 2) {
            const currentProduct = await Product.findById(productId);
            if (currentProduct) {
                const existingIds = [productId, ...recommendations.map(r => r._id.toString())];
                
                const filler = await Product.find({
                    category: currentProduct.category,
                    _id: { $nin: existingIds },
                    status: 'Active'
                }).limit(2 - recommendations.length);
                
                recommendations.push(...filler);
            }
        }

        res.json(recommendations);
    } catch (err) {
        console.error("FBT Error:", err);
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

// POST Bulk Actions
router.post('/bulk', protect, admin, async (req, res) => {
    const { ids, action, data } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No products selected' });
    }

    try {
        let result;
        switch (action) {
            case 'activate':
                result = await Product.updateMany({ _id: { $in: ids } }, { status: 'Active' });
                break;
            case 'draft':
                result = await Product.updateMany({ _id: { $in: ids } }, { status: 'Draft' });
                break;
            case 'archive':
                result = await Product.updateMany({ _id: { $in: ids } }, { status: 'Archived' });
                break;
            case 'category':
                if (!data || !data.category) return res.status(400).json({ message: 'Category is required' });
                result = await Product.updateMany({ _id: { $in: ids } }, { category: data.category });
                break;
            case 'delete':
                result = await Product.deleteMany({ _id: { $in: ids } });
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
        
        res.json({ message: 'Bulk action completed', result });
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
