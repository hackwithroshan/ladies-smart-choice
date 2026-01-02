
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const AbandonedCart = require('../models/AbandonedCart');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- RAZORPAY MAGIC CHECKOUT: SHIPPING INFO ---
// @desc    Handle Razorpay Magic Checkout Serviceability & Shipping calculation
// @route   POST /api/orders/shipping-info
// @access  Public (Called by Razorpay)
router.post('/shipping-info', async (req, res) => {
    try {
        // Razorpay sends cart details in the body
        // This is where you can calculate dynamic shipping based on weight or pincode
        // For now, we return a flat 'Free Shipping' to enable the address UI.

        const response = {
            "shipping_options": [
                {
                    "id": "standard_delivery",
                    "name": "Standard Delivery",
                    "amount": 0, // Amount in Paisa (0 means Free)
                    "description": "Delivered within 3-5 business days",
                    "type": "flat"
                }
            ],
            "cod_available": true, // Enable/Disable Cash on Delivery for the address
            "serviceability_status": "serviceable"
        };

        res.status(200).json(response);
    } catch (err) {
        console.error("Razorpay Shipping Info Error:", err);
        res.status(200).json({ "serviceability_status": "unserviceable" });
    }
});

// @desc    Get all abandoned checkouts (Leads)
// @route   GET /api/orders/abandoned
router.get('/abandoned', protect, admin, async (req, res) => {
    try {
        const leads = await AbandonedCart.find({}).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Webhook Handler for Razorpay
// @route   POST /api/orders/webhook/razorpay
router.post('/webhook/razorpay', async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (signature !== digest) {
        return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    try {
        if (event === 'payment.failed' || event === 'magic.checkout.abandoned') {
            const payment = payload.payment?.entity;
            const order = payload.order?.entity;
            
            const contact = payment?.contact || order?.notes?.contact;
            const email = payment?.email || order?.notes?.email;

            if (email) {
                await AbandonedCart.findOneAndUpdate(
                    { email: email },
                    {
                        name: order?.notes?.name || 'Valued Customer',
                        phone: contact,
                        razorpayOrderId: order?.id,
                        total: (order?.amount || 0) / 100,
                        items: order?.notes?.cart_items ? JSON.parse(order.notes.cart_items) : [],
                        status: 'Abandoned',
                        lastAttempt: new Date()
                    },
                    { upsert: true, new: true }
                );
            }
        } 
        
        if (event === 'order.paid') {
            const order = payload.order.entity;
            const email = order.notes?.email;
            if (email) {
                await AbandonedCart.findOneAndUpdate(
                    { email: email },
                    { status: 'Recovered' }
                );
            }
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('Webhook processing error:', err);
        res.status(500).send('Internal Server Error');
    }
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
        await AbandonedCart.findOneAndDelete({ email: order.customerEmail });
        res.status(200).json({ success: true, orderId: order._id });
    } catch (err) {
        console.error("RAZORPAY VERIFY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
