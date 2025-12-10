
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const StoreDetails = require('../models/StoreDetails');
const { protect, admin } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendCapiEvent } = require('../utils/facebookCapiService');
const { createNotification } = require('../utils/createNotification');
const { generateInvoice } = require('../utils/generateInvoice');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

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
    // **FIX:** Initialize Razorpay inside the handler and check for keys.
    // This prevents the entire application from crashing if keys are missing.
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay keys are not configured in the .env file.");
        return res.status(500).json({ message: 'Payment gateway is not configured. Please contact support.' });
    }
    
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { amount, currency } = req.body;
    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit, ensure it's an integer
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
    const { paymentInfo, items, eventId, ...orderData } = req.body;

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
        
        // 5. Save internal analytics event for Purchase
        try {
            const analyticsEvent = new AnalyticsEvent({
                eventType: 'Purchase',
                path: '/checkout',
                source: orderData.source || 'direct', // Default source if not provided
                data: {
                    eventId: eventId,
                    value: savedOrder.total,
                    currency: 'INR',
                    contents: savedOrder.items.map(item => ({
                        id: item.productId.toString(),
                        quantity: item.quantity,
                        item_price: item.price,
                    })),
                    order_id: savedOrder._id.toString(),
                }
            });
            await analyticsEvent.save();
        } catch (analyticsError) {
            // Do not fail the order if analytics saving fails. Just log it.
            console.error("Failed to save internal Purchase analytics event:", analyticsError);
        }

        // 6. Send order confirmation via Meta CAPI (Server-Side)
        sendCapiEvent({
            eventName: 'Purchase',
            eventUrl: `${process.env.FRONTEND_URL}/checkout`,
            eventId: eventId, // Use event_id from client for deduplication
            userData: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                email: savedOrder.customerEmail,
                phone: savedOrder.customerPhone,
                fbp: req.body.fbp,
                fbc: req.body.fbc,
            },
            customData: {
                value: savedOrder.total,
                currency: 'INR',
                content_ids: savedOrder.items.map(item => item.productId.toString()),
                content_type: 'product',
                contents: savedOrder.items.map(item => ({
                    id: item.productId.toString(),
                    quantity: item.quantity,
                    item_price: item.price,
                })),
                order_id: savedOrder._id.toString(),
            }
        });

        // 7. Create a notification for admins
        await createNotification({
            type: 'NEW_ORDER',
            message: `New order #${savedOrder._id.toString().substring(0, 6)} for ₹${savedOrder.total.toFixed(2)} placed by ${savedOrder.customerName}.`,
            link: `/admin?view=orders&id=${savedOrder._id.toString()}` // A deep link for the future
        });

        // 8. Generate Invoice and send Order Confirmation Email (Fire and forget)
        try {
            const [fullOrder, storeDetails] = await Promise.all([
                Order.findById(savedOrder._id).populate('items.productId'),
                StoreDetails.findOne()
            ]);
            const invoicePdf = await generateInvoice(fullOrder, storeDetails);
            await sendOrderConfirmationEmail(fullOrder, invoicePdf);
        } catch (emailError) {
            console.error(`Failed to send order confirmation email for order ${savedOrder._id}:`, emailError);
        }


        res.status(201).json({ order: savedOrder, accountCreated });
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ message: 'Server error during order creation' });
    }
});

// Resend order confirmation email
router.post('/:id/resend-email', protect, admin, async (req, res) => {
    try {
        const [order, storeDetails] = await Promise.all([
            Order.findById(req.params.id).populate('items.productId'),
            StoreDetails.findOne()
        ]);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        
        const invoicePdf = await generateInvoice(order, storeDetails);
        await sendOrderConfirmationEmail(order, invoicePdf);
        
        res.json({ message: `Confirmation email for order #${order.id.substring(0,8)} has been resent to ${order.customerEmail}.` });

    } catch (error) {
        console.error(`Failed to resend email for order ${req.params.id}:`, error);
        res.status(500).json({ message: "Error resending email. Check server logs." });
    }
});


module.exports = router;
