
const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const { protect, admin } = require('../middleware/authMiddleware');

// --- RAZORPAY MAGIC CHECKOUT ENDPOINTS ---

// @desc    Get applicable promotions for Razorpay
// @route   GET /api/discounts/razorpay/list
// @access  Public (Called by Razorpay)
router.get('/razorpay/list', async (req, res) => {
    try {
        const now = new Date();
        // Fetch all active, non-expired discounts
        const discounts = await Discount.find({
            expiry: { $gt: now }
        });

        // Map to Razorpay Promotion Object Format
        const promotions = discounts.map(d => ({
            code: d.code,
            description: d.type === 'Percentage' ? `${d.value}% Off on your order` : `Flat ₹${d.value} Off`,
            label: d.code,
            // You can add logic here to filter by order_id or customer if needed
        }));

        res.json({ promotions });
    } catch (err) {
        console.error("Razorpay List Coupons Error:", err);
        res.status(500).json({ promotions: [] });
    }
});

// @desc    Apply/Validate promotion for Razorpay
// @route   POST /api/discounts/razorpay/apply
// @access  Public (Called by Razorpay)
router.post('/razorpay/apply', async (req, res) => {
    const { code, order_amount } = req.body;

    try {
        const discount = await Discount.findOne({ 
            code: code.toUpperCase(),
            expiry: { $gt: new Date() }
        });

        if (!discount) {
            return res.status(200).json({
                valid: false,
                error_message: "Invalid or expired coupon code."
            });
        }

        if (discount.usageCount >= discount.maxUsage) {
            return res.status(200).json({
                valid: false,
                error_message: "Coupon usage limit reached."
            });
        }

        // Calculate discount amount (in Paisa, as Razorpay uses smallest currency unit)
        // Note: order_amount from Razorpay is usually in Paisa
        let discountAmountPaisa = 0;
        const amount = order_amount / 100; // Convert to Rupees for calculation

        if (discount.type === 'Percentage') {
            discountAmountPaisa = Math.round((amount * (discount.value / 100)) * 100);
        } else if (discount.type === 'Flat') {
            discountAmountPaisa = discount.value * 100;
        }

        res.json({
            valid: true,
            discount_amount: discountAmountPaisa,
            description: `Discount of ${discount.type === 'Percentage' ? discount.value + '%' : '₹' + discount.value} applied!`
        });
    } catch (err) {
        console.error("Razorpay Apply Coupon Error:", err);
        res.status(200).json({ valid: false, error_message: "Internal server error." });
    }
});

// --- STANDARD ADMIN CRUD ENDPOINTS ---

router.get('/', protect, admin, async (req, res) => {
    try {
        const discounts = await Discount.find({}).sort({ createdAt: -1 });
        res.json(discounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', protect, admin, async (req, res) => {
    const newDiscount = new Discount(req.body);
    try {
        await newDiscount.save();
        res.status(201).json(newDiscount);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await Discount.findByIdAndDelete(req.params.id);
        res.json({ message: 'Discount deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
