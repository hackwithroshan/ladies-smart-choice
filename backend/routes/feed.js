
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

// Meta Catalog Sync API - Fixed Error #100 (item_type mandatory)
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('CONFIGURATION_MISSING: Dashboard mein Catalog ID aur Token save karein.');
        }

        const products = await Product.find({ status: 'Active' });
        if (products.length === 0) throw new Error('DATA_EMPTY: Sync karne ke liye koi active product nahi mila.');

        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        /**
         * Meta Batch Request Payload
         * Fixed Error #100: Added 'item_type' field inside the data object
         */
        const requests = products.map(p => ({
            method: 'UPDATE',
            retailer_id: p.sku || p._id.toString(),
            data: {
                title: p.name,
                description: (p.shortDescription || p.description || p.name).replace(/<[^>]*>?/gm, '').substring(0, 4900),
                link: `${frontendUrl}/product/${p.slug}`,
                image_link: p.imageUrl,
                brand: p.brand || settings.storeName || 'Ladies Smart Choice',
                inventory: Math.max(0, p.stock),
                condition: 'new',
                price: Math.round(p.price),
                currency: 'INR',
                availability: p.stock > 0 ? 'in stock' : 'out of stock',
                item_type: 'PRODUCT_ITEM', // CRITICAL FIX: Meta requires this exactly for items_batch
                status: 'active'
            }
        }));

        // Push to Meta Graph API v19.0
        const response = await fetch(`https://graph.facebook.com/v19.0/${settings.metaCatalogId}/items_batch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.metaAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                allow_upsert: true,
                requests: requests 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Meta API Error Raw:", result);
            const errorMsg = result.error?.message || 'Meta API returned an error';
            throw new Error(errorMsg);
        }

        log.status = 'success';
        log.processedCount = products.length;
        await log.save();

        res.json({ 
            success: true, 
            message: `SUCCESS: ${products.length} products pushed to Meta Catalog.`,
            meta_handle: result.handles?.[0]
        });

    } catch (error) {
        console.error("Meta Sync Fatal Failure:", error.message);
        log.status = 'failed';
        log.error = error.message;
        await log.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/sync-logs', protect, admin, async (req, res) => {
    const logs = await SyncLog.find({ service: 'meta-catalog' }).sort({ timestamp: -1 }).limit(10);
    res.json(logs);
});

module.exports = router;
