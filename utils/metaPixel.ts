
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initFacebookPixel = (pixelId: string) => {
  if (!pixelId || typeof window === 'undefined' || window.fbq) return;

  const cleanPixelId = pixelId.trim();

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

  window.fbq('init', cleanPixelId);
};

export const trackEvent = (event: string, data?: any) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const { event_id, ...params } = data || {};
  
  // 🔥 CRITICAL: Match catalog structure exactly
  const enhancedParams = {
      ...params,
      content_type: 'product',
      item_type: 'PRODUCT_ITEM' 
  };

  const standardEvents = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Search', 'Contact'];
  
  if (standardEvents.includes(event)) {
      window.fbq('track', event, enhancedParams, { event_id });
  } else {
      window.fbq('trackCustom', event, enhancedParams, { event_id });
  }
};
