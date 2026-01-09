
const fetch = require('node-fetch');
const crypto = require('crypto');
const SiteSettings = require('../models/SiteSettings');

/**
 * SHA-256 Hashing for Meta User Data Privacy (GDPR/PII)
 */
function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
}

/**
 * Meta Conversion API (CAPI) - Server Side Tracking
 * Vital for iOS14+ and AdBlocker bypass
 */
const sendCapiEvent = async ({ eventName, eventUrl, eventId, userData, customData = {} }) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaPixelId || !settings.metaAccessToken) {
            return; // Exit silently if not configured
        }

        // Prepare User Data (Normalized and Hashed)
        const user_data = {
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent,
            fbp: userData.fbp,
            fbc: userData.fbc,
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
        };

        // Map standard events to Meta requirements
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
                    value: customData.value || 0,
                    // content_ids MUST match retailer_id in Catalog Sync
                    content_ids: customData.content_ids || (customData.productId ? [customData.productId] : []),
                    content_name: customData.content_name,
                    content_category: customData.category,
                    content_type: 'product',
                    num_items: customData.num_items || 1
                },
            }]
        };

        // For Testing via Events Manager
        if (customData.test_event_code) {
            eventPayload.test_event_code = customData.test_event_code;
        }

        const response = await fetch(`https://graph.facebook.com/v19.0/${settings.metaPixelId}/events`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.metaAccessToken}`
            },
            body: JSON.stringify(eventPayload),
        });

        const result = await response.json();
        if (!response.ok) {
            console.error(`[Meta-CAPI-Error]`, result.error?.message);
        }

    } catch (error) {
        console.error(`[Meta-CAPI-Fatal]`, error.message);
    }
};

module.exports = { sendCapiEvent };
