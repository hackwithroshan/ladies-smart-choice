
const fetch = require('node-fetch');
const crypto = require('crypto');
const SiteSettings = require('../models/SiteSettings');

/**
 * SHA-256 Hashing (Required for Meta User Data Privacy)
 */
function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
}

/**
 * META CONVERSIONS API (CAPI) BRIDGE
 * Synchronizes server-side events with Browser Pixel for 100% visibility
 */
const sendCapiEvent = async ({ eventName, eventUrl, eventId, userData, customData = {} }) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaPixelId || !settings.metaAccessToken) return;

        // User Data Transformation (Matched with Meta requirements)
        const user_data = {
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent,
            fbp: userData.fbp,
            fbc: userData.fbc,
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
        };

        // Aligning content_ids with Catalog ID format (SKU or MongoDB ID)
        // This is critical for Retargeting Ads (DABA/DPA)
        const contentIds = customData.items 
            ? customData.items.map(i => String(i.sku || i.productId || i.id || i._id))
            : (customData.productId ? [String(customData.productId)] : []);

        const eventPayload = {
            data: [{
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                event_source_url: eventUrl,
                action_source: 'website',
                event_id: eventId,
                user_data: user_data,
                custom_data: {
                    currency: customData.currency || 'INR',
                    value: Number(customData.value || 0),
                    content_ids: contentIds,
                    content_name: customData.content_name,
                    content_category: customData.category,
                    content_type: 'product',
                    num_items: Number(customData.num_items || 1)
                },
            }]
        };

        if (customData.test_event_code) {
            eventPayload.test_event_code = customData.test_event_code;
        }

        const response = await fetch(`https://graph.facebook.com/v21.0/${settings.metaPixelId}/events`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.metaAccessToken}`
            },
            body: JSON.stringify(eventPayload),
        });

        const result = await response.json();
        if (!response.ok) {
            console.error(`[Meta-CAPI-Error] ${eventName}:`, result.error?.message);
        }

    } catch (error) {
        console.error(`[Meta-CAPI-Fatal] Connection refused:`, error.message);
    }
};

module.exports = { sendCapiEvent };
