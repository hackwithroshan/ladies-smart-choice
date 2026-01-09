
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

// Meta Catalog Sync API - Permanent Fix for Error #100
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('CONFIGURATION_MISSING: Meta Catalog ID or Access Token is missing.');
        }

        const products = await Product.find({ status: 'Active' });
        if (products.length === 0) throw new Error('DATA_EMPTY: No active products found.');

        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        /**
         * Meta Batch Request Transformation
         * FIXED: Injected 'item_type' and formatted price/currency exactly as Meta requires.
         */
        const requests = products.map(p => {
            const retailerId = p.sku || p._id.toString();
            return {
                method: 'UPDATE',
                retailer_id: retailerId,
                data: {
                    id: retailerId, // Aapke format ke mutabiq
                    title: p.name,
                    description: (p.shortDescription || p.description || p.name).replace(/<[^>]*>?/gm, '').substring(0, 4900),
                    link: `${frontendUrl}/product/${p.slug}`,
                    image_link: p.imageUrl,
                    brand: p.brand || settings.storeName || 'Ladies Smart Choice',
                    inventory: Math.max(0, p.stock),
                    condition: 'new',
                    price: `${Math.round(p.price)} INR`, // "1299 INR" format
                    availability: p.stock > 0 ? 'in stock' : 'out of stock',
                    item_type: 'PRODUCT_ITEM', // 🔥 MANDATORY FIX
                    status: 'active',
                    checkout_url: `${frontendUrl}/product/${p.slug}`
                }
            };
        });

        // Meta recommends batches for sync
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
            console.error("Meta API Error:", JSON.stringify(result));
            throw new Error(result.error?.message || 'Meta API rejected the request');
        }

        log.status = 'success';
        log.processedCount = products.length;
        await log.save();

        res.json({ 
            success: true, 
            message: `Successfully synced ${products.length} products with Meta.`,
            meta_handle: result.handles?.[0]
        });

    } catch (error) {
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
