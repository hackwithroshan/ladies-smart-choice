
const fetch = require('node-fetch');
const crypto = require('crypto');
const SiteSettings = require('../models/SiteSettings');

function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
}

/**
 * META CONVERSIONS API (CAPI) BRIDGE v4.0
 * Deduplication enabled via event_id
 */
const sendCapiEvent = async ({ eventName, eventUrl, eventId, userData, customData = {} }) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaPixelId || !settings.metaAccessToken) return;

        const pixelId = settings.metaPixelId.trim();
        const accessToken = settings.metaAccessToken.trim();

        // 1. Prepare User Data (Hashed for privacy)
        const user_data = {
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent,
            fbp: userData.fbp,
            fbc: userData.fbc,
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
        };

        // 2. Prepare Content IDs (Must match Catalog Retailer ID)
        let contentIds = [];
        if (customData.items) {
            contentIds = customData.items.map(i => String(i.sku || i.productId || i.id));
        } else if (customData.productId) {
            contentIds = [String(customData.productId)];
        }

        const eventPayload = {
            data: [{
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                event_source_url: eventUrl,
                action_source: 'website',
                event_id: eventId, // Used for deduplication with browser pixel
                user_data: user_data,
                custom_data: {
                    currency: customData.currency || 'INR',
                    value: Number(customData.value || 0),
                    content_ids: contentIds,
                    content_type: 'product',
                    num_items: Number(customData.num_items || 1)
                },
            }]
        };

        const response = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(eventPayload),
        });

        const result = await response.json();
        if (!response.ok) {
            console.error(`[Meta-CAPI-Error]`, JSON.stringify(result));
        }

    } catch (error) {
        console.error(`[Meta-CAPI-Fatal]`, error.message);
    }
};

module.exports = { sendCapiEvent };
