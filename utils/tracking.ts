
import { trackEvent as trackPixelEvent } from './metaPixel';
import { getApiUrl } from './apiHelper';

const getCookie = (name: string): string => {
    if (typeof document === 'undefined') return '';
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
    const eventId = `${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Real-time Browser Pixel
    trackPixelEvent(eventName, {
        ...pixelData,
        event_id: eventId,
    });

    // Persistent Server-Side Tracking (CAPI Bridge)
    const payload = {
        eventType: eventName,
        path: window.location.pathname,
        domain: window.location.hostname,
        eventId: eventId,
        source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
        data: {
            ...internalData,
            ...pixelData,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc')
        }
    };

    fetch(getApiUrl('analytics/track'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
    }).catch(() => {});
};
