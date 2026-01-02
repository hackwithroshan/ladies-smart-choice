
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
});

router.post('/verify', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, orderDetails } = req.body;
    
    try {
        if (!razorpay_payment_id) {
            return res.status(400).json({ success: false, message: "Payment ID missing" });
        }

        // Fetch payment details to get address and contact info
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        const shipping = payment.shipping_address || {};
        const notes = payment.notes || {};

        const order = new Order({
            items: orderDetails.items,
            total: orderDetails.total,
            userId: req.user ? req.user._id : null,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            customerName: payment.contact_name || payment.notes?.name || payment.email || "Customer",
            customerEmail: payment.email || orderDetails.customerEmail,
            customerPhone: payment.contact,
            shippingAddress: {
                address: shipping.line1 || notes.shipping_address || "Address captured via Razorpay",
                city: shipping.city || notes.shipping_city || "N/A",
                postalCode: shipping.zipcode || notes.shipping_zip || "000000",
                country: shipping.country || "India"
            }
        });

        await order.save();
        res.status(200).json({ success: true, orderId: order._id });
    } catch (err) {
        console.error("RAZORPAY VERIFY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get all orders for admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Create manual order (Admin)
router.post('/manual', protect, admin, async (req, res) => {
    const { customerInfo, items, financials, notes, paymentStatus } = req.body;
    try {
        const order = new Order({
            items: items.map(i => ({
                productId: i.id || i._id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                imageUrl: i.imageUrl
            })),
            total: financials.total,
            userId: customerInfo.id || null,
            status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            shippingAddress: {
                address: customerInfo.address,
                city: customerInfo.city,
                postalCode: customerInfo.postalCode,
                country: customerInfo.country
            },
            notes: notes
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
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

// @desc    Update order status or tracking (Admin)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.body.status) order.status = req.body.status;
        if (req.body.trackingInfo) order.trackingInfo = req.body.trackingInfo;

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/track', async (req, res) => {
    const { orderId, email } = req.body;
    try {
        const query = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
        const order = await Order.findOne({ ...query, customerEmail: email });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Tracking failed' });
    }
});

module.exports = router;
