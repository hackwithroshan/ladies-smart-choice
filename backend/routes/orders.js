
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const AbandonedCart = require('../models/AbandonedCart');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper to ensure user exists for order
const syncUser = async (email, name, phone) => {
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Create user with phone as password
            user = await User.create({
                name,
                email: email.toLowerCase(),
                password: phone, // This will be hashed by pre-save middleware
            });
        } else {
            // Update name if it changed
            user.name = name;
            await user.save();
        }
        return user;
    } catch (e) {
        console.error("User Sync Error:", e);
        return null;
    }
};

// @desc    Get All Orders (Admin Registry)
// @route   GET /api/orders
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Internal server error fetching orders." });
    }
});

// @desc    Administrative Master Update (Override all fields)
router.put('/:id/master-update', protect, admin, async (req, res) => {
    try {
        const { 
            customerName, customerEmail, customerPhone, status, 
            address, city, postalCode, carrier, trackingNumber, notes 
        } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Manifest not found" });

        // Update Identity
        order.customerName = customerName;
        order.customerEmail = customerEmail;
        order.customerPhone = customerPhone;
        order.status = status;
        
        // Update Logistics
        order.shippingAddress = {
            ...order.shippingAddress,
            address,
            city,
            postalCode
        };

        // Update Fulfillment
        order.trackingInfo = {
            carrier,
            trackingNumber,
            estimatedDelivery: order.trackingInfo?.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };

        order.notes = notes;

        await order.save();
        res.json({ success: true, message: "Ledger updated" });
    } catch (err) {
        res.status(500).json({ message: "Override protocol failed" });
    }
});

// @desc    Get Razorpay Key
router.get('/key', (req, res) => res.json({ key: process.env.RAZORPAY_KEY_ID }));

// @desc    Step 1: Create Order Instance
router.post('/create-standard-order', async (req, res) => {
    try {
        const total = Number(req.body.total);
        const amount = Math.round(total * 100);

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
        const email = payment.email;
        const name = notes.name || payment.email.split('@')[0];
        const phone = payment.contact;

        // Sync User
        const user = await syncUser(email, name, phone);

        const newOrder = new Order({
            userId: user ? user._id : undefined,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
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
        res.json({ success: true, orderId: newOrder._id, email, phone });

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
        const info = orderDetails.customerInfo;
        
        // Sync User
        const user = await syncUser(info.email, info.name, info.phone);

        const newOrder = new Order({
            userId: user ? user._id : undefined,
            customerName: info.name,
            customerEmail: info.email,
            customerPhone: info.phone,
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
            shippingAddress: info.shippingAddress
        });

        await newOrder.save();
        res.json({ success: true, orderId: newOrder._id, email: info.email, phone: info.phone });
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

// @desc    Update Order Status
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
});

module.exports = router;
