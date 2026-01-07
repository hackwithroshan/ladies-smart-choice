
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const AbandonedCart = require('../models/AbandonedCart');
const Discount = require('../models/Discount');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Admin: Create Manual Order
// @route   POST /api/orders/manual
router.post('/manual', protect, admin, async (req, res) => {
    try {
        const { customerInfo, items, financials, notes, paymentStatus } = req.body;
        
        const newOrder = new Order({
            userId: customerInfo.id || null,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            items: items.map(i => ({
                productId: i.id || i._id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                imageUrl: i.imageUrl
            })),
            total: financials.total,
            status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
            shippingAddress: {
                address: customerInfo.address,
                city: customerInfo.city,
                postalCode: customerInfo.postalCode,
                country: customerInfo.country || 'India'
            },
            checkoutType: 'standard',
            notes: notes
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create manual order." });
    }
});

// @desc    Admin: Update Order Status & Tracking
// @route   PUT /api/orders/:id/status
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status, trackingInfo } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status) order.status = status;
        if (trackingInfo) {
            order.trackingInfo = {
                carrier: trackingInfo.carrier,
                trackingNumber: trackingInfo.trackingNumber,
                estimatedDelivery: trackingInfo.estimatedDelivery
            };
            order.trackingHistory.push({
                status: 'Shipped',
                message: `Package handed over to ${trackingInfo.carrier}`,
                date: new Date()
            });
        }

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Track Order (Public)
// @route   POST /api/orders/track
router.post('/track', async (req, res) => {
    const { orderId, email } = req.body;
    try {
        // Search by orderNumber or ID
        const query = orderId.length < 10 ? { orderNumber: orderId } : { _id: orderId };
        const order = await Order.findOne({ ...query, customerEmail: email });
        
        if (!order) return res.status(404).json({ message: 'Order details mismatch.' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
