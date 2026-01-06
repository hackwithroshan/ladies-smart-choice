
const fetch = require('node-fetch');
const crypto = require('crypto');
const SiteSettings = require('../models/SiteSettings');

// Helper to hash user data as per Meta's requirements (SHA-256)
function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * Advanced Server-Side Event Sender for Meta CAPI
 */
const sendCapiEvent = async ({ eventName, eventUrl, eventId, userData, customData = {}, testEventCode }) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaPixelId || !settings.metaAccessToken) {
            console.log('CAPI SKIPPED: Meta configuration missing in settings.');
            return;
        }

        // Advanced User Data for Better Matching
        const user_data = {
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent,
            fbp: userData.fbp, // Browser cookie _fbp
            fbc: userData.fbc, // Browser cookie _fbc
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
            external_id: userData.userId ? [hash(userData.userId)] : undefined
        };

        const eventData = {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: eventUrl,
            action_source: 'website',
            event_id: eventId, // CRITICAL for deduplication with Pixel
            user_data: user_data,
            custom_data: {
                ...customData,
                currency: customData.currency || 'INR',
                value: customData.value || 0,
                contents: customData.contents || [], // [{id: 'sku', quantity: 1}]
                content_type: customData.content_type || 'product'
            },
        };
        
        const payload = { data: [eventData] };
        if (testEventCode) payload.test_event_code = testEventCode;

        const url = `https://graph.facebook.com/v19.0/${settings.metaPixelId}/events?access_token=${settings.metaAccessToken}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        if (!response.ok) {
            console.error(`CAPI Error [${eventName}]:`, responseData.error?.message);
        } else {
            console.log(`CAPI Success [${eventName}]: ID ${eventId}`);
        }
    } catch (error) {
        console.error(`CAPI Critical Failure [${eventName}]:`, error.message);
    }
};

module.exports = { sendCapiEvent };
