
const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all discounts (Admin)
router.get('/', protect, admin, async (req, res) => {
    try {
        const discounts = await Discount.find({}).sort({ createdAt: -1 });
        res.json(discounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Create discount
router.post('/', protect, admin, async (req, res) => {
    try {
        const discount = new Discount(req.body);
        const saved = await discount.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Update discount
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updated = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Delete discount
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await Discount.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon purged' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Validate coupon (Public/Checkout)
router.post('/validate', async (req, res) => {
    const { code, cartTotal, userId } = req.body;
    try {
        const discount = await Discount.findOne({ code: code.toUpperCase(), isActive: true });
        if (!discount) return res.status(404).json({ message: 'Invalid or inactive coupon code.' });

        const now = new Date();
        if (discount.startDate && now < discount.startDate) return res.status(400).json({ message: 'Coupon not yet active.' });
        if (discount.endDate && now > discount.endDate) return res.status(400).json({ message: 'Coupon expired.' });
        if (discount.usageCount >= discount.maxUsage) return res.status(400).json({ message: 'Coupon usage limit reached.' });
        if (cartTotal < discount.minOrderValue) return res.status(400).json({ message: `Minimum order of ₹${discount.minOrderValue} required.` });

        res.json(discount);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
