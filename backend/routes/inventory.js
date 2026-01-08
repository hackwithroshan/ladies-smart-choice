
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Adjust Stock Level
// @route   PUT /api/inventory/adjust/:id
router.put('/adjust/:id', protect, admin, async (req, res) => {
    try {
        const { type, quantity, reason } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) return res.status(404).json({ message: 'Asset not found' });

        const adjustment = type === 'in' ? Math.abs(quantity) : -Math.abs(quantity);
        const newStock = Math.max(0, (product.stock || 0) + adjustment);

        product.stock = newStock;
        await product.save();

        res.json({ 
            success: true, 
            newStock, 
            message: `Inventory synced. ${type === 'in' ? 'Added' : 'Removed'} ${quantity} units.` 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
