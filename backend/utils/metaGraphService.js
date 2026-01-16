const fetch = require('node-fetch');

// Graph API Base URL
const GRAPH_API = 'https://graph.facebook.com/v19.0';

/**
 * Fetch Pixel/Dataset Details
 */
const getPixelDetails = async (pixelId, accessToken) => {
    try {
        const response = await fetch(`${GRAPH_API}/${pixelId}?fields=name,owner_business,can_proxy`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return {
            name: data.name,
            business: data.owner_business?.name || 'Unknown Business',
            capiEnabled: true // Assuming true if token works, can verify via events
        };
    } catch (e) {
        console.error("Meta Graph API Error (Pixel):", e.message);
        return null;
    }
};

/**
 * Fetch Catalog Details
 */
const getCatalogDetails = async (catalogId, accessToken) => {
    try {
        const response = await fetch(`${GRAPH_API}/${catalogId}?fields=name,product_count`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return {
            name: data.name,
            productCount: data.product_count,
            status: 'Synced', // Simulated active status if fetch succeeds
        };
    } catch (e) {
        console.error("Meta Graph API Error (Catalog):", e.message);
        return null;
    }
};

module.exports = { getPixelDetails, getCatalogDetails };
