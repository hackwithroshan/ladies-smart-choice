
import { trackEvent as trackPixelEvent } from './metaPixel';
import { getApiUrl } from './apiHelper';

const getCookie = (name: string): string => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
};

/**
 * masterTracker orchestrates both Browser Pixel and Server CAPI events
 * to ensure 100% data accuracy even with AdBlockers.
 */
export const masterTracker = (
    eventName: string,
    pixelData: Record<string, any> = {},
    internalData: Record<string, any> = {}
) => {
    // Generate a unique Event ID for deduplication between Pixel and CAPI
    const eventId = `${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Fire Browser-side Pixel
    trackPixelEvent(eventName, {
        ...pixelData,
        event_id: eventId,
    });

    // 2. Prepare and fire Server-side CAPI event
    const payload = {
        eventType: eventName,
        path: window.location.pathname,
        domain: window.location.hostname,
        eventId: eventId,
        source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
        data: {
            ...internalData,
            ...pixelData,
            // Capture Meta cookies for high match quality
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc')
        }
    };

    fetch(getApiUrl('analytics/track'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // Ensure request finishes even if page unloads
    }).catch(() => {
        // Silent fail for tracking to not interrupt user experience
    });
};
