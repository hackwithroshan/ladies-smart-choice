
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const AbandonedCart = require('../models/AbandonedCart');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Get Razorpay Key
router.get('/key', (req, res) => res.json({ key: process.env.RAZORPAY_KEY_ID }));

// @desc    Step 1: Create Order Instance
router.post('/create-standard-order', async (req, res) => {
    try {
        const total = Number(req.body.total);
        const amount = Math.round(total * 100); // convert to paisa and ensure integer

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
                coupon: req.body.couponCode || 'NONE'
            }
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) { 
        console.error("Razorpay Order Create Error:", err);
        res.status(500).json({ message: "Failed to initialize payment gateway." }); 
    }
});

// @desc    Step 2: Verify Magic Checkout (Express)
router.post('/verify-magic', async (req, res) => {
    const { razorpay_payment_id, orderDetails } = req.body;

    try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
            return res.status(400).json({ success: false, message: 'Payment not successful' });
        }

        const shipping = payment.shipping_address || {};
        const notes = payment.notes || {};

        const newOrder = new Order({
            customerName: notes.name || payment.email.split('@')[0],
            customerEmail: payment.email,
            customerPhone: payment.contact,
            items: orderDetails.items.map(i => ({
                productId: i.id || i._id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                imageUrl: i.imageUrl
            })),
            total: orderDetails.total,
            status: 'Paid',
            paymentId: razorpay_payment_id,
            checkoutType: 'magic',
            shippingAddress: {
                address: notes.address || shipping.line1 || "Contact customer for address",
                city: notes.city || shipping.city || "Unknown",
                postalCode: notes.postal_code || shipping.postal_code || "000000",
                country: 'India'
            }
        });

        await newOrder.save();
        res.json({ success: true, orderId: newOrder._id });

    } catch (err) {
        console.error("Magic Verify Error:", err);
        res.status(500).json({ success: false, message: "Transaction verification failed." });
    }
});

// @desc    Step 3: Standard Checkout Verification
router.post('/verify-standard', async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderDetails } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        const newOrder = new Order({
            customerName: orderDetails.customerInfo.name,
            customerEmail: orderDetails.customerInfo.email,
            customerPhone: orderDetails.customerInfo.phone,
            items: orderDetails.items.map(i => ({
                productId: i.id || i._id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                imageUrl: i.imageUrl
            })),
            total: orderDetails.total,
            status: 'Paid',
            paymentId: razorpay_payment_id,
            checkoutType: 'standard',
            shippingAddress: orderDetails.customerInfo.shippingAddress
        });

        await newOrder.save();
        res.json({ success: true, orderId: newOrder._id });
    } else {
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

router.get('/abandoned', protect, admin, async (req, res) => {
    try {
        const leads = await AbandonedCart.find({}).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch leads" });
    }
});

module.exports = router;
