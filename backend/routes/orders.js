
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

/**
 * 1. CREATE STANDARD RAZORPAY ORDER (Server-Side)
 * This fixes the "Payment initialization failed" error.
 */
router.post('/create-standard-order', optionalProtect, async (req, res) => {
    try {
        const { total, couponCode } = req.body;
        let finalAmount = total;

        // Security Check: If a coupon is provided, verify it again on the server
        if (couponCode) {
            const discount = await Discount.findOne({ 
                code: couponCode.toUpperCase(),
                expiry: { $gt: new Date() }
            });
            
            if (discount && discount.usageCount < discount.maxUsage) {
                // Calculation matches frontend logic for consistency
                if (discount.type === 'Percentage') {
                    const discountVal = (total * (discount.value / 100));
                    finalAmount = total - discountVal;
                } else if (discount.type === 'Flat') {
                    finalAmount = total - discount.value;
                }
            }
        }

        const options = {
            amount: Math.round(Math.max(1, finalAmount) * 100), // Amount in paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
                applied_coupon: couponCode || "none"
            }
        };

        const rzpOrder = await razorpay.orders.create(options);
        res.status(200).json(rzpOrder);
    } catch (err) {
        console.error("RAZORPAY ORDER CREATION ERROR:", err);
        res.status(500).json({ message: "Failed to initialize Razorpay Order." });
    }
});

/**
 * ADMIN ONLY: Fetch all orders
 */
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch orders." });
    }
});

/**
 * ADMIN ONLY: Create Manual Order
 */
router.post('/manual', protect, admin, async (req, res) => {
    try {
        const { customerInfo, items, financials, notes, paymentStatus } = req.body;
        
        const newOrder = new Order({
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            shippingAddress: {
                address: customerInfo.address,
                city: customerInfo.city,
                postalCode: customerInfo.postalCode,
                country: customerInfo.country
            },
            items: items.map(i => ({
                productId: i.id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                imageUrl: i.imageUrl
            })),
            total: financials.total,
            status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
            notes: notes,
            checkoutType: 'standard'
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * STANDARD CHECKOUT VERIFICATION
 */
router.post('/verify-standard', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderDetails } = req.body;
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Signature mismatch." });
        }

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

        // If coupon was used, increment usage count
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (rzpOrder.notes?.applied_coupon && rzpOrder.notes.applied_coupon !== "none") {
            await Discount.findOneAndUpdate(
                { code: rzpOrder.notes.applied_coupon },
                { $inc: { usageCount: 1 } }
            );
        }

        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (err) {
        console.error("VERIFICATION ERROR:", err);
        res.status(500).json({ success: false });
    }
});

/**
 * MAGIC CHECKOUT VERIFICATION
 */
router.post('/verify-magic', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, orderDetails } = req.body;
    try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const rzpShipping = payment.shipping_address || {};
        
        const newOrder = new Order({
            userId: req.user ? req.user._id : null,
            items: orderDetails.items,
            total: orderDetails.total,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            customerName: payment.contact_name || payment.notes?.customer_name || "Magic Customer",
            customerEmail: payment.email || "not-provided@razorpay.com",
            customerPhone: payment.contact || "0000000000",
            shippingAddress: {
                address: rzpShipping.line1 || "Address not provided by Razorpay",
                city: rzpShipping.city || "N/A",
                postalCode: rzpShipping.zipcode || "000000",
                country: rzpShipping.country || "India"
            },
            checkoutType: 'magic'
        });

        await newOrder.save();
        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.post('/track', async (req, res) => {
    const { orderId, email } = req.body;
    try {
        const query = orderId.length === 24 ? { _id: orderId } : { orderNumber: parseInt(orderId) };
        const order = await Order.findOne({ ...query, customerEmail: email });
        if (!order) return res.status(404).json({ message: "Order not found." });
        res.json(order);
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) { res.status(500).json({ message: "Failed to fetch your orders." }); }
});

router.get('/abandoned', protect, admin, async (req, res) => {
    try {
        const leads = await AbandonedCart.find({}).sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (err) { res.status(500).json({ message: "Failed to fetch abandoned leads." }); }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.userId?.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized" });
        }
        res.json(order);
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ message: "Update failed" }); }
});

router.get('/key', (req, res) => res.json({ key: process.env.RAZORPAY_KEY_ID }));

module.exports = router;
