
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const AbandonedCart = require('../models/AbandonedCart');
const Discount = require('../models/Discount');
const User = require('../models/User'); // Import User model
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');
const { createShipment } = require('../services/shippingService');
const { sendCapiEvent } = require('../utils/facebookCapiService');
const { generateInvoice } = require('../utils/generateInvoice');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { triggerAutomation } = require('../services/emailService');
const { sendGoogleEvent } = require('../utils/googleAdsService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper to ensure customer exists in User collection
const ensureCustomer = async (customerInfo) => {
    try {
        const { email, name, phone } = customerInfo;
        if (!email) return null;

        let user = await User.findOne({ email });
        if (!user) {
            // Create a new user with a random password
            const randomPassword = crypto.randomBytes(8).toString('hex');
            user = await User.create({
                name: name || 'Guest Customer',
                email: email,
                phone: phone,
                password: randomPassword,
                role: 'User'
            });
        } else {
            let changed = false;
            // Always update phone if provided and different to capture latest
            if (phone && user.phone !== phone) {
                user.phone = phone;
                changed = true;
            }
            // Update name if provided and significantly different (not just empty vs Guest)
            if (name && name !== 'Guest Customer' && user.name !== name) {
                user.name = name;
                changed = true;
            }
            if (changed) await user.save();
        }
        return user;
    } catch (error) {
        console.error("Error ensuring customer:", error);
        return null; // Don't block flow if user creation fails
    }
};

// --- PUBLIC ROUTES ---

router.post('/create-standard-order', optionalProtect, async (req, res) => {
    try {
        const { total, couponCode } = req.body;
        let finalAmount = total;
        if (couponCode) {
            const discount = await Discount.findOne({ code: couponCode.toUpperCase(), expiry: { $gt: new Date() } });
            if (discount && discount.usageCount < discount.maxUsage) {
                if (discount.type === 'Percentage') finalAmount = total - (total * (discount.value / 100));
                else if (discount.type === 'Flat') finalAmount = total - discount.value;
            }
        }
        const options = {
            amount: Math.round(Math.max(1, finalAmount) * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: { applied_coupon: couponCode || "none" }
        };
        const rzpOrder = await razorpay.orders.create(options);
        res.status(200).json(rzpOrder);
    } catch (err) { res.status(500).json({ message: "Failed to initialize Razorpay Order." }); }
});

router.post('/verify-standard', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderDetails } = req.body;
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const gen_sig = crypto.createHmac('sha256', secret).update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');
        if (gen_sig !== razorpay_signature) return res.status(400).json({ success: false, message: "Invalid Signature." });

        // Ensure User Exists
        const user = await ensureCustomer(orderDetails.customerInfo);

        const newOrder = new Order({
            userId: user ? user._id : (req.user ? req.user._id : null),
            items: orderDetails.items,
            total: orderDetails.total,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            customerName: orderDetails.customerInfo.name,
            customerEmail: orderDetails.customerInfo.email,
            customerPhone: orderDetails.customerInfo.phone,
            shippingAddress: orderDetails.customerInfo.shippingAddress,
            checkoutType: 'standard'
        });
        await newOrder.save();

        // AUTOMATION: Send Confirmation Email
        if (newOrder.customerEmail) {
            try {
                const pdfBuffer = await generateInvoice(newOrder);
                await sendOrderConfirmationEmail(newOrder, pdfBuffer);
            } catch (e) { console.error("Order Confirmation Email Failed:", e); }
        }

        // CLEANUP: Remove from Abandoned Checkouts if payment is successful
        // This ensures "orders" has PAID orders, and "abandoned" has UNPAID leads only.
        try {
            await AbandonedCart.deleteMany({
                $or: [
                    { email: orderDetails.customerInfo.email },
                    { phone: orderDetails.customerInfo.phone }
                ]
            });
        } catch (delErr) { console.log("Abandoned cleanup warning:", delErr.message); }

        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (rzpOrder.notes?.applied_coupon && rzpOrder.notes.applied_coupon !== "none") {
            await Discount.findOneAndUpdate({ code: rzpOrder.notes.applied_coupon }, { $inc: { usageCount: 1 } });
        }

        // Send CAPI Event (Standard)
        sendCapiEvent({
            eventName: 'Purchase',
            eventUrl: `${process.env.FRONTEND_URL}/checkout`,
            eventId: `purchase_${newOrder._id}`,
            userData: {
                email: orderDetails.customerInfo.email,
                phone: orderDetails.customerInfo.phone,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            customData: {
                value: newOrder.total,
                currency: 'INR',
                order_id: newOrder._id,
                contents: newOrder.items.map(item => ({ id: item.productId, quantity: item.quantity }))
            }
        });

        // Send Google Ads Conversion
        sendGoogleEvent({
            eventName: 'Purchase',
            eventId: newOrder._id.toString(),
            value: newOrder.total,
            currency: 'INR',
            userData: {
                email: orderDetails.customerInfo.email,
                phone: orderDetails.customerInfo.phone,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            items: newOrder.items
        });

        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/verify-magic', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, orderDetails } = req.body;
    try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const rzpShipping = payment.shipping_address || {};

        // Ensure User Exists
        const magicCustomerInfo = {
            name: payment.contact_name || payment.notes?.customer_name || "Magic Customer",
            email: payment.email || "magic-guest@razorpay.com",
            phone: payment.contact
        };
        const user = await ensureCustomer(magicCustomerInfo);

        const newOrder = new Order({
            userId: user ? user._id : (req.user ? req.user._id : null),
            items: orderDetails.items,
            total: orderDetails.total,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            customerName: payment.contact_name || payment.notes?.customer_name || "Magic Customer",
            customerEmail: payment.email || "magic-guest@razorpay.com",
            customerPhone: payment.contact || "0000000000",
            shippingAddress: {
                address: rzpShipping.line1 || rzpShipping.address || "Address Captured by Razorpay",
                city: rzpShipping.city || "N/A",
                postalCode: rzpShipping.zipcode || rzpShipping.pincode || "000000",
                country: rzpShipping.country || "India"
            },
            checkoutType: 'magic'
        });
        await newOrder.save();

        // AUTOMATION: Send Confirmation Email
        if (newOrder.customerEmail && !newOrder.customerEmail.includes("magic-guest")) {
            try {
                const pdfBuffer = await generateInvoice(newOrder);
                await sendOrderConfirmationEmail(newOrder, pdfBuffer);
            } catch (e) { console.error("Order Confirmation Email Failed:", e); }
        }

        // CLEANUP: Remove from Abandoned Checkouts if payment is successful
        try {
            await AbandonedCart.deleteMany({
                $or: [
                    { email: payment.email },
                    { phone: payment.contact }
                ]
            });
        } catch (delErr) { console.log("Abandoned cleanup warning:", delErr.message); }

        // Send CAPI Event (Magic)
        sendCapiEvent({
            eventName: 'Purchase',
            eventUrl: `${process.env.FRONTEND_URL}/checkout`,
            eventId: `purchase_${newOrder._id}`,
            userData: {
                email: payment.email || undefined,
                phone: payment.contact || undefined,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            customData: {
                value: newOrder.total,
                currency: 'INR',
                order_id: newOrder._id,
                contents: newOrder.items.map(item => ({ id: item.productId, quantity: item.quantity }))
            }
        });

        // Send Google Ads Conversion (Magic)
        sendGoogleEvent({
            eventName: 'Purchase',
            eventId: newOrder._id.toString(),
            value: newOrder.total,
            currency: 'INR',
            userData: {
                email: payment.email,
                phone: payment.contact,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            items: newOrder.items
        });

        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

// --- ADMIN ROUTES ---

router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) { res.status(500).json({ message: "Failed to fetch orders." }); }
});

router.get('/abandoned', protect, admin, async (req, res) => {
    try {
        const leads = await AbandonedCart.find({}).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;

        // If status is 'Packed' and auto-shipping is on, push to logistics
        if (status === 'Packed') {
            const shipment = await createShipment(order);
            if (shipment.success) {
                order.trackingInfo = {
                    carrier: shipment.carrier,
                    trackingNumber: shipment.trackingNumber,
                    estimatedDelivery: shipment.estimatedDelivery
                };
                order.trackingHistory.push({
                    status: 'Manifested',
                    message: `Awb assigned: ${shipment.trackingNumber}`,
                    date: new Date()
                });
            }
        }

        await order.save();
        res.json(order);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updateData = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/tracking', protect, admin, async (req, res) => {
    try {
        const { carrier, trackingNumber } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, {
            trackingInfo: { carrier, trackingNumber },
            $push: { trackingHistory: { status: 'Shipped', message: `Order shipped via ${carrier}`, date: new Date() } }
        }, { new: true });
        res.json(order);

        // AUTOMATION: Order Shipped
        if (order.customerEmail) {
            try {
                triggerAutomation('ORDER_SHIPPED',
                    { email: order.customerEmail },
                    {
                        customer_name: order.customerName,
                        order_number: order._id.toString().substring(0, 8),
                        tracking_number: trackingNumber,
                        carrier: carrier,
                        tracking_url: `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}` // Simple fallback
                    },
                    { context: { orderId: order._id } }
                );
            } catch (e) { console.error("Shipping Email Failed:", e); }
        }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});


router.post('/abandoned/log', async (req, res) => {
    try {
        const { email, phone, name, items, total, shippingAddress } = req.body;

        if (!email && !phone) return res.status(400).json({ message: "Email or Phone required" });

        // Find existing abandoned cart by email or phone (if phone valid)
        let query = { $or: [] };
        if (email) query.$or.push({ email: email });
        // Only query by phone if it seems valid (e.g. > 5 chars) to avoid matches on partial inputs
        if (phone && phone.length > 5) query.$or.push({ phone: phone });

        if (query.$or.length === 0) return res.status(400).json({ message: "Invalid contact info" });

        // Ensure User Exists for Lead
        await ensureCustomer({ name, email, phone });

        let abandonedCart = await AbandonedCart.findOne(query);

        if (abandonedCart) {
            // Update
            abandonedCart.items = items;
            abandonedCart.total = total;
            abandonedCart.lastAttempt = Date.now();
            if (shippingAddress) abandonedCart.shippingAddress = shippingAddress; // If model supports it, otherwise ignore
            // Update contact info if provided and was missing
            if (name) abandonedCart.name = name;
            if (email) abandonedCart.email = email;
            if (phone) abandonedCart.phone = phone;
        } else {
            // Create New
            // Generate 12-digit numeric ID
            const checkoutId = Math.floor(100000000000 + Math.random() * 900000000000);

            abandonedCart = new AbandonedCart({
                checkoutId,
                email, phone, name, items, total,
                shippingAddress,
                status: 'Abandoned'
            });
        }

        await abandonedCart.save();
        res.status(200).json({ success: true, cartId: abandonedCart._id });
    } catch (err) {
        console.error("Abandoned Cart Log Error:", err);
        res.status(500).json({ message: "Failed to log abandoned cart" });
    }
});

router.get('/key', (req, res) => res.json({ key: process.env.RAZORPAY_KEY_ID }));


module.exports = router;
