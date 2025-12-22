
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const StoreDetails = require('../models/StoreDetails');
const { protect, admin } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendCapiEvent } = require('../utils/facebookCapiService');
const { createNotification } = require('../utils/createNotification');
const { generateInvoice } = require('../utils/generateInvoice');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { createShipment, syncOrderStatus } = require('../services/shippingService');

// Helper to get next sequence
async function getNextOrderNumber() {
    const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

// --- Admin: Get all orders ---
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ date: -1 }).populate('items.productId', 'name sku');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Admin: Create Manual Order ---
router.post('/manual', protect, admin, async (req, res) => {
    try {
        const { customerInfo, items, financials, notes, paymentStatus } = req.body;

        let userId = null;
        if (customerInfo.id) {
            userId = customerInfo.id;
        } else {
            const existingUser = await User.findOne({ email: customerInfo.email });
            if (existingUser) userId = existingUser._id;
        }

        const orderItems = items.map(item => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl
        }));

        // Generate Numeric Order ID
        const orderNumber = await getNextOrderNumber();

        const newOrder = new Order({
            orderNumber,
            userId: userId,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            shippingAddress: {
                address: customerInfo.address,
                city: customerInfo.city,
                postalCode: customerInfo.postalCode,
                country: customerInfo.country || 'India'
            },
            items: orderItems,
            total: financials.total,
            status: paymentStatus === 'Paid' ? 'Processing' : 'Pending',
            date: new Date(),
            paymentInfo: {
                razorpay_payment_id: paymentStatus === 'Paid' ? 'MANUAL_ENTRY' : 'PENDING',
                razorpay_order_id: `MANUAL_${Date.now()}`,
                razorpay_signature: 'ADMIN_CREATED'
            },
        });

        const savedOrder = await newOrder.save();
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

// --- PUBLIC: Track Order ---
router.post('/track', async (req, res) => {
    let { orderId, email } = req.body;
    if (!orderId || !email) return res.status(400).json({ message: 'Order ID/Number and Email required.' });
    
    orderId = orderId.trim();
    email = email.trim().toLowerCase();

    try {
        let order;
        // Check if input is the numeric Order Number (e.g., 1001)
        if (!isNaN(Number(orderId))) {
            order = await Order.findOne({ orderNumber: Number(orderId) }).populate('items.productId', 'name imageUrl');
        }

        // Fallback to internal ID or Tracking ID
        if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
            order = await Order.findById(orderId).populate('items.productId', 'name imageUrl');
        }
        if (!order) {
            order = await Order.findOne({ 'trackingInfo.trackingNumber': orderId }).populate('items.productId', 'name imageUrl');
        }

        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.customerEmail.toLowerCase() !== email) return res.status(401).json({ message: 'Email mismatch.' });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Admin: Update status ---
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) return res.status(404).json({ message: 'Order not found' });
        const newStatus = req.body.status;
        if (newStatus === 'Shipped' && existingOrder.status !== 'Shipped' && (!existingOrder.trackingInfo || !existingOrder.trackingInfo.trackingNumber)) {
            const shipmentData = await createShipment(existingOrder);
            if (shipmentData.success) {
                req.body.trackingInfo = {
                    carrier: shipmentData.carrier,
                    trackingNumber: shipmentData.trackingNumber,
                    shippingLabelUrl: shipmentData.shippingLabelUrl,
                    estimatedDelivery: shipmentData.estimatedDelivery
                };
            }
        }
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Create Razorpay Order ID ---
router.post('/razorpay-order', async (req, res) => {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const { amount, currency } = req.body;
    try {
        const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency, receipt: `rcpt_${Date.now()}` });
        res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) { res.status(500).send(error); }
});

// --- Create New Order after payment ---
router.post('/', async (req, res) => {
    const { paymentInfo, items, eventId, ...orderData } = req.body;
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`);
    if (shasum.digest('hex') !== paymentInfo.razorpay_signature) return res.status(400).json({ message: 'Payment invalid' });

    try {
        let user;
        const existingUser = await User.findOne({ email: orderData.customerEmail });
        if (existingUser) { user = existingUser; } 
        else {
            user = new User({ name: orderData.customerName, email: orderData.customerEmail, password: orderData.customerPhone, role: 'User' });
            await user.save();
        }
        
        const orderNumber = await getNextOrderNumber();
        const newOrder = new Order({
            ...orderData,
            orderNumber,
            userId: user._id,
            items: items.map((item) => ({ productId: item.id, name: item.name, quantity: item.quantity, price: item.price, imageUrl: item.imageUrl })),
            paymentInfo,
            status: 'Processing',
            trackingHistory: [{ status: 'Ordered', location: 'Online', message: 'Order placed successfully.', date: new Date() }]
        });
        const savedOrder = await newOrder.save();
        for (const item of items) await Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } });
        res.status(201).json({ order: savedOrder });
    } catch (error) { res.status(500).json({ message: 'Order creation failed' }); }
});

module.exports = router;
