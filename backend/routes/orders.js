
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

/**
 * @desc    Shipping Info API for Razorpay Magic Checkout
 * @route   POST /api/orders/shipping-info
 * @access  Public (Called by Razorpay Servers)
 */
router.post('/shipping-info', async (req, res) => {
    // Razorpay sends the address/pincode in the body
    const { city, pincode, state } = req.body;
    
    try {
        // Aap yahan check kar sakte hain ki Pincode serviceabe hai ya nahi
        // Filhaal hum FREE Shipping bhej rahe hain sabke liye
        res.status(200).json({
            shipping_methods: [
                {
                    id: "std",
                    label: "Standard Delivery",
                    amount: 0, // 0 means FREE Shipping
                    description: "3-5 Business Days"
                }
            ],
            cod_allowed: true // Agar aap Magic Checkout mein COD dikhana chahte hain
        });
    } catch (error) {
        res.status(500).json({ message: "Shipping calculation failed" });
    }
});

// @desc    Initialize Magic Order
router.post('/initiate', protect, async (req, res) => {
    const { amount, items } = req.body;
    try {
        const line_items = items.map(item => ({
            name: item.name,
            amount: Math.round(item.price * 100),
            currency: "INR",
            quantity: item.quantity
        }));

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            // CRITICAL: Magic Checkout requires these notes to show Address
            notes: {
                shipping_address_required: "true",
                billing_address_required: "true"
            },
            line_items: line_items
        };

        const rzpOrder = await razorpay.orders.create(options);
        res.status(201).json({ id: rzpOrder.id, key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        res.status(500).json({ message: "Magic Order Failed", error });
    }
});

// @desc    Verify Payment and Save Address
router.post('/verify', protect, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
    
    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString()).digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Razorpay se actual payment info fetch kar rahe hain address nikalne ke liye
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
            
            const order = new Order({
                ...orderDetails,
                userId: req.user._id,
                paymentId: razorpay_payment_id,
                status: 'Paid',
                // Razorpay Magic se address nikalne ka tareeka
                shippingAddress: {
                    address: payment.notes.shipping_address || "Address in Payment Notes",
                    city: payment.notes.shipping_city || "Online",
                    postalCode: payment.notes.shipping_zip || "000000",
                    country: "India"
                }
            });
            await order.save();
            res.status(200).json({ success: true, orderId: order._id });
        } else {
            res.status(400).json({ message: "Invalid Signature" });
        }
    } catch (err) {
        res.status(500).json({ message: "Verification process failed" });
    }
});

module.exports = router;
