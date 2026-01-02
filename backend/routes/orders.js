
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * CREATE RAZORPAY ORDER (MAGIC CHECKOUT)
 * Yeh API ensure karti hai ki Popup mein "Order Summary" aur "Address" dikhe.
 */
router.post('/create-rzp-order', optionalProtect, async (req, res) => {
    const { items, total } = req.body;
    
    try {
        // 1. Line Items create karna (Magic Checkout requirements)
        const line_items = items.map(item => ({
            name: item.name,
            amount: Math.round(item.price * 100), // Razorpay demands paise
            currency: "INR",
            quantity: item.quantity,
            description: "Ayurvedic Pure Product",
            image_url: item.imageUrl || ""
        }));

        // 2. Razorpay Order options
        // Magic Checkout ke liye amount required hai, par UI line_items se pick hoga
        const options = {
            amount: Math.round(total * 100), 
            currency: "INR",
            receipt: `order_rcpt_${Date.now()}`,
            partial_payment: false,
            // Magic Checkout configuration
            line_items: line_items,
            notes: {
                shipping_address_required: true, // Force address collection
                billing_address_required: true,
                checkout_type: "magic" 
            }
        };

        const rzpOrder = await razorpay.orders.create(options);
        res.status(200).json(rzpOrder);

    } catch (err) {
        console.error("RAZORPAY ERROR:", err);
        res.status(500).json({ message: "Failed to initialize payment gateway" });
    }
});

/**
 * VERIFY PAYMENT & SAVE ORDER
 */
router.post('/verify', optionalProtect, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderDetails } = req.body;

    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Security Check Failed" });
        }

        // Fetch payment details to get dynamic user address from Razorpay popup
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        const newOrder = new Order({
            items: orderDetails.items,
            total: orderDetails.total,
            userId: req.user ? req.user._id : null,
            paymentId: razorpay_payment_id,
            status: 'Paid',
            customerName: payment.contact_name || "Customer",
            customerEmail: payment.email,
            customerPhone: payment.contact,
            shippingAddress: {
                address: payment.shipping_address?.line1 || "Standard Delivery",
                city: payment.shipping_address?.city || "N/A",
                postalCode: payment.shipping_address?.zipcode || "000000",
                country: "India"
            }
        });

        await newOrder.save();
        res.status(200).json({ success: true, orderId: newOrder._id });

    } catch (err) {
        console.error("VERIFICATION ERROR:", err);
        res.status(500).json({ success: false, message: "Payment logged but sync failed." });
    }
});

router.get('/key', (req, res) => res.json({ key: process.env.RAZORPAY_KEY_ID }));

module.exports = router;
