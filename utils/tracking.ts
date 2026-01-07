
import { trackEvent as trackPixelEvent } from './metaPixel';
import { trackUserEvent as trackInternalEvent } from './analytics';

/**
 * Advanced Multi-Domain Meta Tracker (Shopify-Style)
 * Automatically detects the current environment and fires real-time events.
 */

const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
};

export const masterTracker = (
    eventName: string,
    pixelData: Record<string, any> = {},
    internalData: Record<string, any> = {}
) => {
    // 1. Generate a Unique Global Event ID for Deduplication
    const eventId = `${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 2. Real-time Browser Pixel (Runs on ANY domain where Pixel ID is configured)
    trackPixelEvent(eventName, {
        ...pixelData,
        event_id: eventId,
    });

    // 3. Real-time Server-Side CAPI (Syncs immediately with Meta via Backend)
    trackInternalEvent(
        eventName,
        {
            ...internalData,
            eventId: eventId,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            userAgent: navigator.userAgent,
            sourceUrl: window.location.href,
            domain: window.location.hostname // Dynamics: Tells Meta which domain triggered the event
        }
    );
};
