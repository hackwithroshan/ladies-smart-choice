
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Counter = require('../models/Counter');

// Validate Environment Variables
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    console.error("FATAL ERROR: Razorpay Key ID or Secret is missing in .env file.");
}

const razorpay = new Razorpay({
    key_id: key_id || 'MISSING_KEY_ID',
    key_secret: key_secret || 'MISSING_KEY_SECRET'
});

// Helper for sequential order numbers
async function getNextOrderNumber() {
    const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

/**
 * @route   POST /api/orders/create-magic-order
 * @desc    Initialize a Razorpay Order with Magic Checkout parameters
 */
router.post('/create-magic-order', async (req, res) => {
    try {
        const { items, totalAmount } = req.body;

        if (!key_id || !key_secret) {
            return res.status(500).json({ 
                message: "Payment gateway credentials not configured. Please check backend .env file.",
                debug: { key_id_present: !!key_id, key_secret_present: !!key_secret }
            });
        }

        // Magic Checkout MANDATES line_items for address/tax calculation
        const line_items = items.map(item => ({
            name: item.name,
            amount: Math.round(item.price * 100), // In paise
            currency: "INR",
            quantity: item.quantity
        }));

        const options = {
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            // Magic Checkout Required Fields
            line_items: line_items,
            line_items_total: Math.round(totalAmount * 100)
        };

        const rzpOrder = await razorpay.orders.create(options);
        
        res.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount, // Calculated total in paise
            key: key_id
        });
    } catch (error) {
        console.error("RZP Order API Error:", error);
        
        // Detailed error reporting for 401
        if (error.statusCode === 401) {
            return res.status(401).json({ 
                message: "Razorpay Authentication Failed. Verify Key ID and Secret in your backend .env file.",
                error: error.error 
            });
        }

        res.status(error.statusCode || 500).json({ 
            message: "Failed to initialize payment gateway.",
            error: error.error 
        });
    }
});

/**
 * @route   POST /api/orders/verify-magic-payment
 * @desc    Verify signature and save full customer/shipping data from Magic Checkout
 */
router.post('/verify-magic-payment', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            customer_details, 
            shipping_address,
            local_items
        } = req.body;

        // 1. Signature Verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature." });
        }

        // 2. Create Local Order
        const orderNumber = await getNextOrderNumber();
        const newOrder = new Order({
            orderNumber,
            customerName: customer_details.name,
            customerEmail: customer_details.email,
            customerPhone: customer_details.contact,
            shippingAddress: {
                line1: shipping_address.line1,
                line2: shipping_address.line2,
                city: shipping_address.city,
                state: shipping_address.state,
                pincode: shipping_address.pincode,
                country: shipping_address.country || 'India'
            },
            total: req.body.totalAmount || 0, // Fallback total
            status: 'Paid',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            items: local_items 
        });

        await newOrder.save();

        res.json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Payment verified but failed to save order." });
    }
});

module.exports = router;
