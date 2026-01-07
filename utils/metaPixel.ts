
import { trackUserEvent } from "./analytics";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// List of authorized domains for this Pixel
const AUTHORIZED_DOMAINS = [
    'ladiessmartchoice.com',
    'www.ladiessmartchoice.com',
    'ayushreeayurveda.in',
    'localhost'
];

export const initFacebookPixel = (pixelId: string) => {
  const currentDomain = window.location.hostname;
  
  // FIX for Image 2: Only initialize if domain is authorized
  if (!AUTHORIZED_DOMAINS.includes(currentDomain)) {
    console.warn(`⚠️ Meta Pixel blocked for unauthorized domain: ${currentDomain}`);
    return;
  }

  if (!pixelId) return;
  if (window.fbq) return;

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
  console.log(`✅ Meta Pixel Active on ${currentDomain}`);
};

export const trackEvent = (event: string, data?: any) => {
  const currentDomain = window.location.hostname;
  if (!window.fbq || !AUTHORIZED_DOMAINS.includes(currentDomain)) return;

  const { event_id, ...params } = data || {};
  window.fbq('track', event, params, { event_id });
};
