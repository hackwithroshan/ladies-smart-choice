
import { trackUserEvent } from "./analytics";

// Standard Facebook Pixel Type Definition
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initFacebookPixel = (pixelId: string) => {
  if (!pixelId) {
    console.error("❌ Meta Pixel Error: Pixel ID is missing.");
    return;
  }
  
  if (window.fbq) {
    console.warn("ℹ️ Meta Pixel already initialized.");
    return;
  }

  /* eslint-disable */
  (function(f:any,b:any,e:any,v:any,n?:any,t?:any,s?:any)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)})(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', pixelId);
  
  // The initial PageView event is now handled by the MasterTracker component to ensure
  // it fires consistently on initial load and all subsequent route changes.
  
  console.log(`✅ Meta Pixel Initialized with ID: ${pixelId}`);
};

/**
 * Tracks a standard Meta Pixel event. This function is now primarily called by the masterTracker.
 * @param event The name of the event (e.g., 'ViewContent').
 * @param data The event payload, which should include an event_id for deduplication.
 */
export const trackEvent = (event: string, data?: any) => {
  if (!window.fbq) {
    console.warn(` M-Pixel event "${event}" was not sent. Is an ad blocker active?`);
    return;
  }

  const { event_id, ...params } = data || {};
  
  window.fbq('track', event, params, { event_id });
  console.log(` M-Pixel Event Sent: "${event}" (ID: ${event_id})`, params || '');
};