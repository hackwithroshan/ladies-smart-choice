
const fetch = require('node-fetch');
const crypto = require('crypto');
const SiteSettings = require('../models/SiteSettings');

function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
}

/**
 * Real-time Meta CAPI Dispatcher
 * Dispatches events to Meta Graph API v19.0 immediately upon trigger.
 */
const sendCapiEvent = async ({ eventName, eventUrl, eventId, userData, customData = {} }) => {
    try {
        // Fetch real-time settings from DB
        const settings = await SiteSettings.findOne();
        
        // Safety: If Admin hasn't entered Pixel/Access Token, silent return
        if (!settings || !settings.metaPixelId || !settings.metaAccessToken) {
            console.log(`[Meta-CAPI-Skipped] No credentials found for ${eventName}`);
            return; 
        }

        const user_data = {
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent,
            fbp: userData.fbp,
            fbc: userData.fbc,
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
        };

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
                    content_ids: customData.content_ids || [],
                    content_type: 'product'
                },
            }]
        };

        // Instant POST to Meta
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
        } else {
            console.log(`[Meta-CAPI-Success] Real event "${eventName}" pushed to Meta ID: ${settings.metaPixelId}`);
        }
    } catch (error) {
        console.error(`[Meta-CAPI-Fatal]`, error.message);
    }
};

module.exports = { sendCapiEvent };
