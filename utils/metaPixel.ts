
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const AUTHORIZED_DOMAINS = [
    'ladiessmartchoice.com',
    'www.ladiessmartchoice.com',
    'localhost'
];

export const initFacebookPixel = (pixelId: string) => {
  const currentDomain = window.location.hostname;
  
  if (!AUTHORIZED_DOMAINS.some(d => currentDomain.includes(d))) {
    console.warn(`⚠️ Meta Pixel blocked for domain: ${currentDomain}`);
    return;
  }

  if (!pixelId || window.fbq) return;

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
  console.log(`✅ Meta Pixel Initialized: ${pixelId}`);
};

export const trackEvent = (event: string, data?: any) => {
  if (!window.fbq) return;

  const { event_id, ...params } = data || {};
  
  // Mapping for Standard Events
  const standardEvents = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Search', 'Contact'];
  
  if (standardEvents.includes(event)) {
      window.fbq('track', event, params, { event_id });
  } else {
      window.fbq('trackCustom', event, params, { event_id });
  }
};
