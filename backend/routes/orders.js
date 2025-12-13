
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Required for ObjectId validation
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
const { createShipment, syncOrderStatus } = require('../services/shippingService');

// --- Admin: Get all orders ---
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ date: -1 }).populate('items.productId', 'name sku');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Admin: Create Manual Order (Shopify Style) ---
router.post('/manual', protect, admin, async (req, res) => {
    try {
        const { 
            customerInfo, 
            items, 
            financials, 
            notes, 
            paymentStatus 
        } = req.body;

        // 1. Resolve User
        let userId = null;
        if (customerInfo.id) {
            userId = customerInfo.id;
        } else {
            // Check if email exists, otherwise create or treat as guest
            const existingUser = await User.findOne({ email: customerInfo.email });
            if (existingUser) {
                userId = existingUser._id;
            }
            // Optional: Create new user logic here if needed
        }

        // 2. Map Items (ensure they have all required fields)
        const orderItems = items.map(item => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl
        }));

        // 3. Create Order Object
        const newOrder = new Order({
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
            // Store discounts/notes if you extend the schema, 
            // for now we just handle the total.
        });

        const savedOrder = await newOrder.save();

        // 4. Update Inventory
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // 5. Send Email (Optional - usually manual orders might not want auto-email immediately)
        if (req.body.sendEmail) {
            try {
                const storeDetails = await StoreDetails.findOne();
                const fullOrder = await Order.findById(savedOrder._id).populate('items.productId');
                const invoicePdf = await generateInvoice(fullOrder, storeDetails);
                await sendOrderConfirmationEmail(fullOrder, invoicePdf);
            } catch (err) {
                console.error("Manual order email failed", err);
            }
        }

        res.status(201).json(savedOrder);

    } catch (error) {
        console.error("Manual Create Error:", error);
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

// --- PUBLIC: Track Order (Fixed Logic) ---
router.post('/track', async (req, res) => {
    let { orderId, email } = req.body;

    if (!orderId || !email) {
        return res.status(400).json({ message: 'Please provide Order ID and Email.' });
    }

    // 1. Clean Inputs
    orderId = orderId.trim();
    email = email.trim().toLowerCase();

    try {
        let order;
        
        // 2. Determine Search Method
        // Check if it looks like a valid MongoDB ObjectId (24 hex characters)
        const isObjectId = mongoose.Types.ObjectId.isValid(orderId);

        if (isObjectId) {
             // Try finding by internal Order ID
             order = await Order.findById(orderId).populate('items.productId', 'name imageUrl');
        }

        // If not found by ID (or invalid format), try finding by Tracking Number
        if (!order) {
             order = await Order.findOne({ 'trackingInfo.trackingNumber': orderId }).populate('items.productId', 'name imageUrl');
        }

        if (!order) {
            return res.status(404).json({ message: 'Order not found. Check your Order ID or Tracking Number.' });
        }

        // 3. Verify Email ownership
        if (order.customerEmail.toLowerCase() !== email) {
            return res.status(401).json({ message: 'Email address does not match this order.' });
        }

        // --- REAL-TIME SYNC ---
        // If 15 mins passed since last sync, try to fetch fresh data from courier
        const diff = Date.now() - new Date(order.lastTrackingSync || 0).getTime();
        if (order.status === 'Shipped' && diff > 15 * 60 * 1000) {
             const syncResult = await syncOrderStatus(order);
             if (syncResult) {
                 if (syncResult.status) order.status = syncResult.status;
                 if (syncResult.history) order.trackingHistory = syncResult.history;
                 order.lastTrackingSync = new Date();
                 await order.save();
             }
        }

        res.json(order);
    } catch (error) {
        console.error("Tracking error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Admin: Update order status/details (Auto-Ship Logic) ---
router.put('/:id', protect, admin, async (req, res) => {
    try {
        // 1. Get the existing order first
        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) return res.status(404).json({ message: 'Order not found' });

        const newStatus = req.body.status;
        
        // 2. Logic: If changing to 'Shipped' and no tracking info, generate it automatically
        if (newStatus === 'Shipped' && existingOrder.status !== 'Shipped' && (!existingOrder.trackingInfo || !existingOrder.trackingInfo.trackingNumber)) {
            console.log(`Auto-generating shipment for Order ${existingOrder._id}...`);
            const shipmentData = await createShipment(existingOrder);
            
            if (shipmentData.success) {
                req.body.trackingInfo = {
                    carrier: shipmentData.carrier,
                    trackingNumber: shipmentData.trackingNumber,
                    shippingLabelUrl: shipmentData.shippingLabelUrl,
                    estimatedDelivery: shipmentData.estimatedDelivery
                };
                
                // Add initial history event
                req.body.trackingHistory = [
                    ...(existingOrder.trackingHistory || []),
                    {
                        status: 'Shipped',
                        location: 'Warehouse',
                        message: `Shipment created with ${shipmentData.carrier}. Tracking ID: ${shipmentData.trackingNumber}`,
                        date: new Date()
                    }
                ];
            } else {
                console.error("Auto-ship failed:", shipmentData.error);
                // We typically proceed with saving the status change anyway, but alert backend logs
            }
        }

        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        // TODO: Trigger email notification based on status change here
        
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- Create Razorpay Order ID ---
router.post('/razorpay-order', async (req, res) => {
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
        amount: Math.round(amount * 100),
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

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== paymentInfo.razorpay_signature) {
        return res.status(400).json({ message: 'Transaction not legit!' });
    }

    try {
        let user;
        let accountCreated = false;
        const existingUser = await User.findOne({ email: orderData.customerEmail });
        
        if (existingUser) {
            user = existingUser;
        } else {
            user = new User({
                name: orderData.customerName,
                email: orderData.customerEmail,
                password: orderData.customerPhone,
                role: 'User'
            });
            await user.save();
            accountCreated = true;
        }
        
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
            // Initialize Tracking History
            trackingHistory: [{
                status: 'Ordered',
                location: 'Online',
                message: 'Order placed successfully.',
                date: new Date()
            }]
        });
        
        const savedOrder = await newOrder.save();

        for (const item of items) {
            await Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } });
        }
        
        try {
            const analyticsEvent = new AnalyticsEvent({
                eventType: 'Purchase',
                path: '/checkout',
                source: orderData.source || 'direct',
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
            console.error("Failed to save internal Purchase analytics event:", analyticsError);
        }

        sendCapiEvent({
            eventName: 'Purchase',
            eventUrl: `${process.env.FRONTEND_URL}/checkout`,
            eventId: eventId,
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

        await createNotification({
            type: 'NEW_ORDER',
            message: `New order #${savedOrder._id.toString().substring(0, 6)} for ₹${savedOrder.total.toFixed(2)} placed by ${savedOrder.customerName}.`,
            link: `/admin?view=orders&id=${savedOrder._id.toString()}`
        });

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
