
/**
 * Strips HTML tags and decodes entities to create clean text for meta descriptions.
 */
export const stripHtml = (html: string): string => {
    if (!html) return "";
    if (typeof DOMParser === 'undefined') {
        // Basic fallback for non-browser environments (though this is a CSR app)
        return html.replace(/<[^>]*>?/gm, ''); 
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

/**
 * Truncates text to a specific length without breaking words, ideal for SEO descriptions.
 */
export const truncateText = (text: string, maxLength: number = 160): string => {
    if (!text) return "";
    const cleanText = text.replace(/\s+/g, ' ').trim(); // Remove excess whitespace
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substr(0, cleanText.lastIndexOf(' ', maxLength)) + '...';
};

/**
 * Generates the clean Canonical URL (removes query params like fbclid, utm_source).
 */
export const getCanonicalUrl = (location: any): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${location.pathname}`;
};
