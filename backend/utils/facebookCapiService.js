
const fetch = require('node-fetch');
const crypto = require('crypto');
const SiteSettings = require('../models/SiteSettings');

// Helper to hash user data as per Meta's requirements
function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * Sends a server-side event to the Meta Conversion API.
 * @param {object} params - The event parameters.
 * @param {string} params.eventName - The name of the event (e.g., 'PageView', 'Purchase').
 * @param {string} params.eventUrl - The URL where the event occurred.
 * @param {string} params.eventId - The unique ID for event deduplication.
 * @param {object} params.userData - User PII and browser data.
 * @param {object} [params.customData] - E-commerce specific data (value, currency, contents).
 * @param {string} [params.testEventCode] - Optional code for testing events in Meta Events Manager.
 */
const sendCapiEvent = async ({ eventName, eventUrl, eventId, userData, customData = {}, testEventCode }) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaPixelId || !settings.metaAccessToken) {
            console.log('CAPI SKIPPED: Meta Pixel ID or Access Token not configured.');
            return;
        }

        const eventData = {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: eventUrl,
            action_source: 'website',
            event_id: eventId,
            user_data: {
                client_ip_address: userData.ip,
                client_user_agent: userData.userAgent,
                fbp: userData.fbp,
                fbc: userData.fbc,
                em: userData.email ? [hash(userData.email)] : undefined,
                ph: userData.phone ? [hash(userData.phone)] : undefined,
            },
            custom_data: {
                ...customData,
                currency: customData.currency || 'INR',
            },
        };
        
        const payload = { data: [eventData] };
        
        if (testEventCode) {
            payload.test_event_code = testEventCode;
        }

        const url = `https://graph.facebook.com/v19.0/${settings.metaPixelId}/events?access_token=${settings.metaAccessToken}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error(`CAPI Error for event '${eventName}':`, responseData.error?.message || responseData);
        } else {
            console.log(`CAPI Event Sent: '${eventName}' successfully.`);
        }
    } catch (error) {
        console.error(`CAPI Service Error for event '${eventName}':`, error);
    }
};

module.exports = { sendCapiEvent };
