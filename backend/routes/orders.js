
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Initialize Payment (Backend creates the order with amount)
// @route   POST /api/orders/initiate
router.post('/initiate', protect, async (req, res) => {
    const { amount, items } = req.body;
    try {
        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        };

        const rzpOrder = await razorpay.orders.create(options);
        
        res.status(201).json({
            id: rzpOrder.id,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        res.status(500).json({ message: "Razorpay Order Creation Failed", error });
    }
});

// @desc    Verify Payment and Save to DB
// @route   POST /api/orders/verify
router.post('/verify', protect, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        const order = new Order({
            ...orderDetails,
            userId: req.user._id,
            paymentId: razorpay_payment_id,
            status: 'Paid'
        });
        await order.save();
        res.status(200).json({ success: true, orderId: order._id });
    } else {
        res.status(400).json({ success: false, message: "Invalid Signature" });
    }
});

module.exports = router;
