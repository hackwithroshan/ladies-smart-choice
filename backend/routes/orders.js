
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const SiteSettings = require('../models/SiteSettings');
const Discount = require('../models/Discount');
const { protect, admin } = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/createNotification');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper for human-readable order numbers
async function getNextOrderNumber() {
    try {
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'orderNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        return counter.seq;
    } catch (e) {
        return Math.floor(100000 + Math.random() * 900000);
    }
}

/**
 * RAZORPAY MAGIC CHECKOUT - SHIPPING INFO URL
 * Configured in Razorpay Dashboard Settings.
 * Razorpay calls this to get shipping rates for an address.
 */
router.post('/shipping-info', async (req, res) => {
    try {
        const { order_id, shipping_address } = req.body;
        const settings = await SiteSettings.findOne();
        
        // Logical check: Serviceable area (e.g., India only)
        const isIndia = shipping_address.country === 'in' || shipping_address.country === 'India';
        
        const response = {
            shipping_methods: isIndia ? [
                {
                    id: "standard_delivery",
                    label: "Standard Delivery",
                    amount: (settings?.shippingCharge || 0) * 100, // in paisa
                    description: "Estimated delivery in 5-7 business days"
                }
            ] : [],
            cod_available: isIndia && (settings?.isCodEnabled || false)
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Magic Shipping Error:", error);
        res.status(500).json({ message: "Internal Logistics Error" });
    }
});

/**
 * RAZORPAY MAGIC CHECKOUT - PROMOTIONS URL
 * Razorpay calls this to validate a coupon code entered in Magic UI.
 */
router.post('/promotions', async (req, res) => {
    try {
        const { code } = req.body;
        const discount = await Discount.findOne({ 
            code: code.toUpperCase(),
            expiry: { $gt: new Date() }
        });

        if (!discount || discount.usageCount >= discount.maxUsage) {
            return res.status(404).json({ message: "Invalid or expired coupon." });
        }

        res.status(200).json({
            promotion: {
                id: discount._id.toString(),
                code: discount.code,
                label: discount.type === 'Percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`,
                value: discount.value,
                type: discount.type === 'Percentage' ? 'percentage' : 'flat',
                description: `Discount of ${discount.value} applied!`
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Coupon verification failed" });
    }
});

/**
 * CREATE MAGIC ORDER
 * Initiates the Razorpay order with 'magic' metadata.
 */
router.post('/create-magic-order', async (req, res) => {
    const { items, totalAmount } = req.body;
    try {
        const line_items = items.map(item => ({
            name: item.name,
            amount: Math.round(item.price * 100),
            quantity: item.quantity,
            image_url: item.imageUrl
        }));

        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), 
            currency: "INR",
            receipt: `ayu_${Date.now()}`,
            line_items: line_items,
            notes: { checkout_mode: "magic" }
        });

        res.status(201).json({ 
            id: rzpOrder.id, 
            amount: rzpOrder.amount, 
            key: process.env.RAZORPAY_KEY_ID 
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * VERIFY MAGIC PAYMENT & SYNC DATA
 * Handles order finalization for both COD and Prepaid.
 */
router.post('/verify-magic-payment', async (req, res) => {
    const { 
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        local_items, userId 
    } = req.body;

    try {
        // 1. Signature Verification (Only for Prepaid)
        if (razorpay_payment_id && razorpay_signature) {
            const secret = process.env.RAZORPAY_KEY_SECRET;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ message: "Invalid payment signature." });
            }
        }

        // 2. Fetch ground truth from Razorpay
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (!rzpOrder) return res.status(404).json({ message: "Razorpay order not found." });

        const customer = rzpOrder.customer_details || {};
        const shipping = customer.shipping_address || {};

        // 3. Status Mapping
        let orderStatus = 'Pending';
        if (rzpOrder.status === 'paid') orderStatus = 'Paid';
        else if (rzpOrder.status === 'placed') orderStatus = 'Processing'; // COD success

        // 4. Create MongoDB Order
        const orderNumber = await getNextOrderNumber();
        const order = new Order({
            orderNumber,
            userId: userId || null,
            customerName: shipping.name || customer.name || "Verified Customer",
            customerEmail: customer.email?.toLowerCase().trim() || "guest@ayushree.com",
            customerPhone: customer.contact || "0000000000",
            shippingAddress: {
                address: `${shipping.line1 || ''} ${shipping.line2 || ''}`.trim() || "N/A",
                city: shipping.city || "N/A",
                postalCode: shipping.zipcode || "000000",
                country: shipping.country || "India"
            },
            items: local_items,
            total: rzpOrder.amount / 100,
            status: orderStatus,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id || null,
            paymentMethod: rzpOrder.status === 'paid' ? 'Prepaid (Magic)' : 'COD (Magic)'
        });

        await order.save();

        // 5. Notify Admin
        await createNotification({
            type: 'NEW_ORDER',
            message: `Order #${orderNumber} received via ${order.paymentMethod}. Total: ₹${order.total}`,
            link: `/admin?view=orders&id=${order._id}`
        });

        res.json({ success: true, orderId: order._id });

    } catch (error) {
        console.error("Order Finalization Error:", error);
        res.status(500).json({ message: "Internal server error during order creation." });
    }
});

// Basic list routes
router.get('/', protect, admin, async (req, res) => {
    const orders = await Order.find({}).sort({ date: -1 });
    res.json(orders);
});

router.get('/my-orders', protect, async (req, res) => {
    const orders = await Order.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(orders);
});

// Public Tracking
router.post('/track', async (req, res) => {
    try {
        const { orderId, email } = req.body;
        const query = orderId.length > 15 ? { _id: orderId } : { orderNumber: orderId };
        const order = await Order.findOne({ ...query, customerEmail: email.toLowerCase().trim() });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Tracking failed' });
    }
});

module.exports = router;
