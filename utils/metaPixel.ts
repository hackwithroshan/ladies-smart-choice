
// Standard Facebook Pixel Type Definition
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initFacebookPixel = (pixelId: string) => {
  // 1. Safety Check: If Pixel ID is missing, do nothing and log an error.
  if (!pixelId) {
    console.error("❌ Meta Pixel Error: Pixel ID is missing. Please add it in Admin > Settings > Tracking Pixels.");
    return;
  }
  
  // 2. Prevent double initialization
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

  // 3. Initialize and track the first PageView immediately
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView'); // CORRECTED: Standard PageView event takes no parameters.
  
  console.log(`✅ Meta Pixel Initialized with ID: ${pixelId}`);
};

export const trackEvent = (event: string, data?: any) => {
  if (!window.fbq) {
    // This can happen if init failed (e.g., ad blocker)
    console.warn(` M-Pixel event "${event}" was not sent. Is an ad blocker active?`);
    return;
  }

  const ecommerceEvents = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'];
  let eventData = { ...data };

  // --- Automatic E-commerce Payload Enhancement ---
  // For standard e-commerce events, derive top-level properties from the 'contents' array
  // to ensure data is complete and consistent for Meta's systems.
  if (ecommerceEvents.includes(event) && eventData.contents && Array.isArray(eventData.contents) && eventData.contents.length > 0) {
    eventData = {
      ...eventData,
      content_ids: eventData.contents.map((item: any) => item.id),
      content_type: 'product',
      currency: 'INR',
      value: eventData.contents.reduce((sum: number, item: any) => sum + (item.item_price || 0) * (item.quantity || 1), 0),
    };
  }

  // Enhance data with general context
  const finalPayload = {
    ...eventData,
    page: window.location.pathname,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  window.fbq('track', event, finalPayload);
  console.log(` M-Pixel Event Sent: "${event}"`, finalPayload || '');
};

export const trackCustomEvent = (event: string, data?: any) => {
  if (!window.fbq) {
    console.warn(` M-Pixel custom event "${event}" was not sent. Is an ad blocker active?`);
    return;
  }
  window.fbq('trackCustom', event, data);
  console.log(` M-Pixel Custom Event Sent: "${event}"`, data || '');
};
