
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * @desc    Get Razorpay Public Key
 * @route   GET /api/orders/key
 */
router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
});

/**
 * @desc    Verify Payment & Save Order (Magic Checkout Flow)
 * @route   POST /api/orders/verify
 */
router.post('/verify', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, orderDetails } = req.body;
    
    try {
        if (!razorpay_payment_id) {
            return res.status(400).json({ message: "Payment ID missing" });
        }

        // Fetch actual payment details from Razorpay to get the address captured by Magic Checkout
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        // Magic Checkout puts address in shipping_address or notes
        const shipping = payment.shipping_address || {};
        const notes = payment.notes || {};

        const order = new Order({
            ...orderDetails, 
            userId: req.user ? req.user._id : undefined,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            shippingAddress: {
                address: shipping.line1 || notes.shipping_address || "Captured via Magic UI",
                city: shipping.city || notes.shipping_city || "N/A",
                postalCode: shipping.zipcpde || notes.shipping_zip || "000000",
                country: shipping.country || "India"
            }
        });

        await order.save();
        
        console.log(`Order Saved Successfully: ${order._id}`);
        
        res.status(200).json({ 
            success: true, 
            orderId: order._id 
        });
    } catch (err) {
        console.error("RAZORPAY VERIFY ERROR:", err);
        res.status(500).json({ message: "Order storage failed", error: err.message });
    }
});

router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
