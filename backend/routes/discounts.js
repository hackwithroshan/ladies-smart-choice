
const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * 1. PROMOTIONS LISTING API
 * POST /api/discounts/promotions
 */
router.post('/promotions', async (req, res) => {
    try {
        const { order_id, contact, email } = req.body;
        const now = new Date();

        const activeDiscounts = await Discount.find({
            expiry: { $gt: now },
            $expr: { $lt: ["$usageCount", "$maxUsage"] }
        });

        const promotions = activeDiscounts.map(d => {
            let summary = "";
            let description = "";

            if (d.type === 'Percentage') {
                summary = `${d.value}% OFF`;
                description = `${d.value}% discount on your total cart value.`;
            } else if (d.type === 'Flat') {
                summary = `₹${d.value} OFF`;
                description = `Flat ₹${d.value} discount applied to your order.`;
            } else if (d.type === 'Free Shipping') {
                summary = "FREE SHIPPING";
                description = "No shipping charges for this order.";
            }

            return {
                code: d.code,
                summary: summary,
                description: description
            };
        });

        res.status(200).json({ promotions });

    } catch (err) {
        console.error("PROMOTIONS LISTING ERROR:", err);
        res.status(200).json({ promotions: [] });
    }
});

/**
 * 2. PROMOTION APPLY/VALIDATE API (AS REQUESTED)
 * POST /api/discounts/apply-promo
 * Request Body: { order_id, contact, email, code }
 */
router.post('/apply-promo', async (req, res) => {
    try {
        const { order_id, contact, email, code } = req.body;
        
        // 1. Find the discount code in DB
        const discount = await Discount.findOne({ 
            code: code.toUpperCase(),
            expiry: { $gt: new Date() }
        });

        // 2. Validation Check
        if (!discount || discount.usageCount >= discount.maxUsage) {
            return res.status(400).json({
                error: {
                    code: "INVALID_PROMOTION",
                    description: "This coupon code is invalid or has expired."
                }
            });
        }

        // 3. Prepare response data
        // Convert internal types to Razorpay compatible types
        const valueType = discount.type === 'Percentage' ? 'percentage' : 'fixed_amount';
        
        /**
         * Note: Razorpay accepts value in paise for 'fixed_amount' 
         * and in basis points or direct integer for 'percentage'. 
         * As per your example: 50000 value = ₹500.
         */
        const value = discount.type === 'Percentage' ? (discount.value * 100) : (discount.value * 100);

        // 4. Send Success Response in requested format
        res.status(200).json({
            promotion: {
                "reference_id": `promo_ref_${Date.now()}`, 
                "type": "offer",
                "code": discount.code, 
                "value": value, 
                "value_type": valueType, 
                "description": `${discount.type === 'Percentage' ? discount.value + '%' : '₹' + discount.value} Discount Applied!`
            }
        });

    } catch (err) {
        console.error("PROMOTION APPLY ERROR:", err);
        res.status(500).json({ 
            error: {
                code: "SERVER_ERROR",
                description: "Something went wrong while applying the promotion."
            }
        });
    }
});

// --- ADMIN CRUD ---

router.get('/', protect, admin, async (req, res) => {
    try {
        const discounts = await Discount.find({}).sort({ createdAt: -1 });
        res.json(discounts);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, admin, async (req, res) => {
    const newDiscount = new Discount(req.body);
    try {
        await newDiscount.save();
        res.status(201).json(newDiscount);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await Discount.findByIdAndDelete(req.params.id);
        res.json({ message: 'Discount deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
