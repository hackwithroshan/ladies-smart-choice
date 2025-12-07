
import { trackEvent as trackPixelEvent } from './metaPixel';
import { trackUserEvent as trackInternalEvent } from './analytics';

/**
 * Reads a cookie value by name.
 * @param name The name of the cookie.
 * @returns The cookie's value or an empty string.
 */
const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
};

/**
 * The master tracking function for all e-commerce and analytics events.
 * It generates a unique event ID and fires events to both the Meta Pixel (browser-side)
 * and the internal analytics backend (which then triggers a Meta CAPI event).
 * This ensures dual tracking with automatic deduplication.
 *
 * @param eventName The standard name of the event (e.g., 'ViewContent', 'AddToCart').
 * @param pixelData The data payload for the Meta Pixel event.
 * @param internalData The data payload for the internal analytics/CAPI event.
 */
export const masterTracker = (
    eventName: string,
    pixelData: Record<string, any> = {},
    internalData: Record<string, any> = {}
) => {
    // 1. Generate a unique event ID for deduplication
    const eventId = `${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 2. Fire the browser-side Meta Pixel event with the event ID
    trackPixelEvent(eventName, {
        ...pixelData,
        event_id: eventId,
    });

    // 3. Fire the server-side event via our internal analytics endpoint
    trackInternalEvent(
        eventName,
        {
            ...internalData,
            eventId: eventId, // Pass the same ID to the backend
            // Pass Meta's browser cookies for better CAPI matching
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
        }
    );
};
