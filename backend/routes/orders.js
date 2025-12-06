
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendOrderConfirmationCAPI } = require('../utils/metaCapiService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- Admin: Get all orders ---
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ date: -1 }).populate('items.productId', 'name sku');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- User: Get my orders ---
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Admin: Update order status/details ---
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- Create Razorpay Order ID ---
router.post('/razorpay-order', async (req, res) => {
    const { amount, currency } = req.body;
    const options = {
        amount: amount * 100, // amount in the smallest currency unit
        currency,
        receipt: `receipt_order_${new Date().getTime()}`
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Razorpay order creation error: ", error);
        res.status(500).send(error);
    }
});


// --- Create New Order after payment ---
router.post('/', async (req, res) => {
    const { paymentInfo, items, ...orderData } = req.body;

    // 1. Verify Razorpay Signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== paymentInfo.razorpay_signature) {
        return res.status(400).json({ message: 'Transaction not legit!' });
    }

    try {
        // 2. Check if user exists, if not, create one
        let user;
        let accountCreated = false;
        const existingUser = await User.findOne({ email: orderData.customerEmail });
        
        if (existingUser) {
            user = existingUser;
        } else {
            user = new User({
                name: orderData.customerName,
                email: orderData.customerEmail,
                password: orderData.customerPhone, // Use phone as temporary password
                role: 'User'
            });
            await user.save();
            accountCreated = true;
        }
        
        // 3. Create the order
        const newOrder = new Order({
            ...orderData,
            userId: user._id,
            items: items.map((item) => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                imageUrl: item.imageUrl,
            })),
            paymentInfo: paymentInfo,
            status: 'Processing',
        });
        
        const savedOrder = await newOrder.save();

        // 4. Update product stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } });
        }
        
        // 5. Send order confirmation via Meta CAPI (Server-Side)
        sendOrderConfirmationCAPI(savedOrder, req);


        res.status(201).json({ order: savedOrder, accountCreated });
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ message: 'Server error during order creation' });
    }
});

module.exports = router;
