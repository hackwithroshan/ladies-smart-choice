
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const crypto = require('crypto');
const Order = require('../models/Order');
const Counter = require('../models/Counter');

// Validate Environment Variables at runtime
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    console.error("❌ ERROR: Razorpay Credentials missing in .env");
}

async function getNextOrderNumber() {
    try {
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'orderNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        return counter.seq;
    } catch (e) {
        console.error("Counter Error:", e);
        return Date.now(); // Fallback
    }
}

/**
 * @route   POST /api/orders/create-magic-order
 * @desc    Creates a Razorpay order using standard amount/currency fields.
 *          Note: We removed line_items to avoid the 'extra_field_sent' 400 error.
 */
router.post('/create-magic-order', async (req, res) => {
    try {
        const { totalAmount } = req.body;

        if (!key_id || !key_secret) {
            return res.status(500).json({ 
                message: "Razorpay keys are not configured in backend .env file.",
                error: "MISSING_KEYS"
            });
        }

        // Base64 encode credentials for Basic Auth
        const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');
        
        // Use standard Order API payload. 
        // Including 'line_items' often causes "amount is/are not required" errors 
        // if the account isn't configured for itemized orders.
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                amount: Math.round(totalAmount * 100), // amount in paise
                currency: "INR",
                receipt: `rcpt_${Date.now()}`
            })
        });

        const rzpOrder = await rzpResponse.json();

        if (!rzpResponse.ok) {
            console.error("Razorpay API Error Response:", JSON.stringify(rzpOrder, null, 2));
            throw new Error(rzpOrder.error?.description || "Razorpay order creation failed.");
        }
        
        res.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            key: key_id
        });
    } catch (error) {
        console.error("RZP Create Order Exception:", error);
        res.status(400).json({ 
            message: error.message || "Order creation failed.",
            details: error
        });
    }
});

/**
 * @route   POST /api/orders/verify-magic-payment
 * @desc    Verifies the signature and saves the order to MongoDB.
 */
router.post('/verify-magic-payment', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            customer_details, 
            shipping_address,
            local_items,
            totalAmount
        } = req.body;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Signature verification failed." });
        }

        // Create Order in DB
        const orderNumber = await getNextOrderNumber();
        const newOrder = new Order({
            orderNumber,
            customerName: customer_details.name,
            customerEmail: customer_details.email,
            customerPhone: customer_details.contact,
            shippingAddress: {
                line1: shipping_address.line1,
                line2: shipping_address.line2 || '',
                city: shipping_address.city,
                state: shipping_address.state,
                pincode: shipping_address.pincode,
                country: shipping_address.country || 'India'
            },
            total: totalAmount,
            status: 'Paid',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            items: local_items 
        });

        await newOrder.save();
        res.json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Internal server error during verification." });
    }
});

/**
 * @route   POST /api/orders/track
 * @desc    Fetch order details by Order Number or ID + Email for tracking.
 */
router.post('/track', async (req, res) => {
    try {
        const { orderId, email } = req.body;
        
        // Attempt search by MongoDB ID first, then by Order Number
        const isMongoId = orderId.match(/^[0-9a-fA-F]{24}$/);
        const query = isMongoId 
            ? { _id: orderId, customerEmail: email }
            : { orderNumber: parseInt(orderId), customerEmail: email };
            
        const order = await Order.findOne(query);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found for these details.' });
        }
        
        res.json(order);
    } catch (error) {
        console.error("Order Tracking Error:", error);
        res.status(500).json({ message: 'Server error during tracking.' });
    }
});

module.exports = router;
