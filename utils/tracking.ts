
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
 * masterTracker orchestrates both Browser Pixel and Server CAPI events.
 * It strictly ensures that the content_ids used match the Catalog retailer_id.
 */
export const masterTracker = async (
    eventName: string,
    pixelData: Record<string, any> = {},
    internalData: Record<string, any> = {}
) => {
    try {
        // 1. Deduplication ID
        const eventId = pixelData.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // 2. Standardize Content IDs
        // Important: Ensure we pass the SKU or ID string for Meta catalog matching
        const contentIds = pixelData.content_ids || (pixelData.id ? [String(pixelData.id)] : []);

        const trackingPayload = {
            ...pixelData,
            content_ids: contentIds,
            event_id: eventId
        };

        // 3. Fire Browser-side Pixel
        trackPixelEvent(eventName, trackingPayload);

        // 4. Prepare and fire Server-side CAPI event
        // (Server-side tracking allows capturing events even if AdBlockers are present)
        const capiPayload = {
            eventType: eventName,
            path: window.location.pathname,
            domain: window.location.hostname,
            eventId: eventId,
            data: {
                ...internalData,
                ...pixelData,
                content_ids: contentIds,
                fbp: getCookie('_fbp'),
                fbc: getCookie('_fbc')
            }
        };

        fetch(getApiUrl('analytics/track'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiPayload),
            keepalive: true
        });

    } catch (error) {
        console.warn("[Tracking] Signal failed", error);
    }
};
