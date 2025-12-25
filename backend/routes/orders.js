
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const StoreDetails = require('../models/StoreDetails');
const Counter = require('../models/Counter');
const ActivityLog = require('../models/ActivityLog');
const { protect, admin } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateInvoice } = require('../utils/generateInvoice');

async function getNextOrderNumber() {
    const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

const logAction = async (req, action, target, targetId, details) => {
    try {
        await ActivityLog.create({
            user: req.user?._id,
            userName: req.user?.name || 'System',
            action,
            target,
            targetId,
            details,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (e) { console.error("Logging failed", e); }
};

// GET all orders
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ date: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// GET order invoice PDF
router.get('/:id/invoice', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        const storeDetails = await StoreDetails.findOne() || {};
        const pdfBuffer = await generateInvoice(order, storeDetails);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderNumber || order._id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Invoice generation failed:", error);
        res.status(500).json({ message: 'Failed to generate invoice' });
    }
});

router.post('/manual', protect, admin, async (req, res) => {
    try {
        const { customerInfo, items, financials, paymentStatus } = req.body;
        const orderNumber = await getNextOrderNumber();
        const newOrder = new Order({
            orderNumber,
            userId: customerInfo.id || null,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            shippingAddress: { address: customerInfo.address, city: customerInfo.city, postalCode: customerInfo.postalCode, country: customerInfo.country || 'India' },
            items: items.map(i => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.price, imageUrl: i.imageUrl })),
            total: financials.total,
            status: paymentStatus === 'Paid' ? 'Processing' : 'Pending',
        });
        const savedOrder = await newOrder.save();
        await logAction(req, 'created manual', 'Order', savedOrder._id, `Admin created manual order for ${customerInfo.name}`);
        res.status(201).json(savedOrder);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id', protect, admin, async (req, res) => {
    try {
        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) return res.status(404).json({ message: 'Order not found' });
        
        const newStatus = req.body.status;
        if (newStatus && newStatus !== existingOrder.status) {
            await logAction(req, `status updated to ${newStatus}`, 'Order', existingOrder._id, `Order status changed from ${existingOrder.status} to ${newStatus}`);
        }

        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(order);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.post('/razorpay-order', async (req, res) => {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const { amount, currency } = req.body;
    try {
        const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency, receipt: `rcpt_${Date.now()}` });
        res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) { res.status(500).send(error); }
});

router.post('/', async (req, res) => {
    const { paymentInfo, items, ...orderData } = req.body;
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`);
    if (shasum.digest('hex') !== paymentInfo.razorpay_signature) return res.status(400).json({ message: 'Payment invalid' });

    try {
        const user = await User.findOne({ email: orderData.customerEmail }) || await new User({ name: orderData.customerName, email: orderData.customerEmail, password: orderData.customerPhone, role: 'User' }).save();
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
        await ActivityLog.create({ action: 'purchase', target: 'Order', targetId: savedOrder._id, details: `New order #${orderNumber} placed by ${orderData.customerName}` });
        for (const item of items) await Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } });
        res.status(201).json({ order: savedOrder });
    } catch (error) { res.status(500).json({ message: 'Order creation failed' }); }
});

router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.post('/track', async (req, res) => {
    let { orderId, email } = req.body;
    try {
        let order = !isNaN(Number(orderId)) ? await Order.findOne({ orderNumber: Number(orderId) }) : await Order.findById(orderId);
        if (!order) order = await Order.findOne({ 'trackingInfo.trackingNumber': orderId });
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.customerEmail.toLowerCase() !== email.toLowerCase()) return res.status(401).json({ message: 'Email mismatch.' });
        res.json(order);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

module.exports = router;
