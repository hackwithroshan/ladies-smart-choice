
import { getApiUrl } from './apiHelper';

const getSource = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fbclid') || params.get('utm_source')?.toLowerCase() === 'facebook') return 'meta';
    if (params.get('gclid') || params.get('utm_source')?.toLowerCase() === 'google') return 'google';
    if (params.get('utm_source')) return 'ads'; // Generic ads

    const referrer = document.referrer;
    if (!referrer) return 'direct';
    if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) return 'organic';

    return 'referral';
};

export const trackUserEvent = (eventType: string, data: Record<string, any> = {}) => {
    try {
        const params = new URLSearchParams(window.location.search);
        const payload = {
            eventType,
            path: window.location.pathname,
            source: getSource(),
            utm: {
                source: params.get('utm_source'),
                medium: params.get('utm_medium'),
                campaign: params.get('utm_campaign'),
            },
            ...data
        };
        
        // Fire and forget
        fetch(getApiUrl('/api/analytics/track'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        });
    } catch (error) {
        console.warn(`[Analytics] Event '${eventType}' tracking failed:`, error);
    }
};