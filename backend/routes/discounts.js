
const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, async (req, res) => {
    const discounts = await Discount.find({}).sort({ createdAt: -1 });
    res.json(discounts);
});

router.post('/', protect, admin, async (req, res) => {
    const newDiscount = new Discount(req.body);
    await newDiscount.save();
    res.status(201).json(newDiscount);
});

router.delete('/:id', protect, admin, async (req, res) => {
    await Discount.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discount deleted' });
});

module.exports = router;
