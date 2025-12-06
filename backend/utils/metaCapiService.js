
const fetch = require('node-fetch');
const SiteSettings = require('../models/SiteSettings');

const sendOrderConfirmationCAPI = async (order, req) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaPixelId) {
            console.log('CAPI: Meta Access Token or Pixel ID not configured. Skipping server event.');
            return;
        }

        const eventData = {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: order.paymentInfo.razorpay_order_id, // Use a unique order ID for deduplication
            user_data: {
                em: [hash(order.customerEmail)], // Hashed email
                ph: [hash(order.customerPhone)], // Hashed phone
                fbc: req.cookies?._fbc,
                fbp: req.cookies?._fbp,
                client_ip_address: req.ip,
                client_user_agent: req.headers['user-agent'],
            },
            custom_data: {
                currency: 'INR',
                value: order.total,
                content_ids: order.items.map(item => item.productId.toString()),
                content_type: 'product',
                contents: order.items.map(item => ({
                    id: item.productId.toString(),
                    quantity: item.quantity,
                    item_price: item.price,
                })),
                order_id: order._id.toString(),
            },
            action_source: 'website',
        };

        const payload = {
            data: [eventData],
            // test_event_code: 'YOUR_TEST_EVENT_CODE' // Optional: for testing
        };

        const response = await fetch(`https://graph.facebook.com/v19.0/${settings.metaPixelId}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.metaAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();
        if (!response.ok) {
            console.error('CAPI Error:', responseData.error?.message || responseData);
        } else {
            console.log('CAPI: Purchase event sent successfully.');
        }

    } catch (error) {
        console.error('Error sending CAPI event:', error);
    }
};

// Basic SHA256 hashing helper
const crypto = require('crypto');
function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(data.toLowerCase()).digest('hex');
}

module.exports = { sendOrderConfirmationCAPI };
