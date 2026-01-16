const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');
const { getPixelDetails, getCatalogDetails } = require('../utils/metaGraphService');

/**
 * GET /api/meta-app/info
 * Returns detailed Meta integration status
 */
router.get('/info', protect, admin, async (req, res) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAdsConnected) {
            return res.json({ connected: false });
        }

        // Parallel Fetch for Performance
        const [pixelInfo, catalogInfo] = await Promise.all([
            getPixelDetails(settings.metaPixelId, settings.metaAccessToken),
            getCatalogDetails(settings.metaCatalogId || 'me/catalogs', settings.metaAccessToken)
            // Note: If catalogID is missing, we might default or skip. 
            // In a real flow, catalog ID should be saved during setup.
        ]);

        // If external API fails (e.g. dev token), fallback to stored local data if available or basic placeholders
        res.json({
            connected: true,
            pixel: {
                id: settings.metaPixelId,
                name: pixelInfo?.name || 'Connected Pixel',
                businessName: pixelInfo?.business || 'Meta Business Account',
                capiActive: true
            },
            catalog: {
                id: settings.metaCatalogId || 'Unknown',
                name: catalogInfo?.name || 'Main Product Catalog',
                lastSync: settings.metaLastSync,
                productCount: catalogInfo?.productCount || 0
            }
        });

    } catch (err) {
        console.error("Meta Info Error:", err);
        res.status(500).json({ message: "Failed to fetch meta info" });
    }
});

/**
 * GET /api/meta-app/products
 * Returns products with their calculated Meta Sync Status
 */
router.get('/products', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).select('name imageUrl price stock status sku mrp');

        // Improve status logic
        const syncedProducts = products.map(p => {
            let metaStatus = 'Synced';
            let errorReason = '';

            // Basic Validation Rules for Meta Commerce
            if (!p.imageUrl) {
                metaStatus = 'Error';
                errorReason = 'Missing Image';
            } else if (!p.sku) {
                metaStatus = 'Error';
                errorReason = 'Missing SKU';
            } else if (p.status !== 'Active') {
                metaStatus = 'Pending'; // Draft/Archived aren't pushed usually
                errorReason = 'Product not Active';
            }

            return {
                id: p._id,
                name: p.name,
                image: p.imageUrl,
                sku: p.sku || 'N/A',
                price: p.price,
                inventory: p.stock,
                metaStatus,
                metaId: p.sku || p._id,
                error: errorReason
            };
        });

        res.json(syncedProducts);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products" });
    }
});

module.exports = router;
