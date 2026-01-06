
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const AbandonedCart = require('../models/AbandonedCart');
const Discount = require('../models/Discount');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');
const { createShipment } = require('../services/shippingService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

        const newOrder = new Order({
            userId: req.user ? req.user._id : null,
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
        
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (rzpOrder.notes?.applied_coupon && rzpOrder.notes.applied_coupon !== "none") {
            await Discount.findOneAndUpdate({ code: rzpOrder.notes.applied_coupon }, { $inc: { usageCount: 1 } });
        }
        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/verify-magic', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, orderDetails } = req.body;
    try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        // Extract shipping from payment object (Captured by Razorpay Magic)
        const rzpShipping = payment.shipping_address || {};
        const contactEmail = payment.email || (req.user ? req.user.email : "magic-guest@razorpay.com");
        const contactName = payment.contact_name || (req.user ? req.user.name : "Magic Customer");
        const contactPhone = payment.contact || "0000000000";

        const newOrder = new Order({
            userId: req.user ? req.user._id : null,
            items: orderDetails.items,
            total: orderDetails.total,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            customerName: contactName,
            customerEmail: contactEmail,
            customerPhone: contactPhone,
            shippingAddress: {
                address: rzpShipping.line1 || rzpShipping.address || "Address Captured by Razorpay",
                city: rzpShipping.city || "N/A",
                postalCode: rzpShipping.zipcode || rzpShipping.pincode || "000000",
                country: rzpShipping.country || "India"
            },
            checkoutType: 'magic'
        });
        await newOrder.save();
        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (err) { 
        console.error("Magic Verify Error:", err);
        res.status(500).json({ success: false, message: err.message }); 
    }
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

// Admin: Delete order
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/key', (req, res) => res.json({ key: process.env.RAZORPAY_KEY_ID }));

module.exports = router;
