
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

/**
 * Meta Catalog Batch API Integration
 * Fixed Error #100: Missing item_type
 * Fixed: ID Mismatch and Data Quality
 */
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('CONFIG_ERROR: Meta Access Token or Catalog ID is missing in settings.');
        }

        const products = await Product.find({ status: 'Active' });
        if (products.length === 0) throw new Error('DATA_ERROR: No active products found to sync.');

        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        /**
         * Transform local products into Meta's batch request format
         * Requirements: 
         * - retailer_id must match Content ID in Pixel
         * - item_type: 'PRODUCT_ITEM' is mandatory for many catalog types
         */
        const requests = products.map(p => {
            const retailerId = p.sku || p._id.toString();
            return {
                method: 'UPDATE',
                retailer_id: retailerId,
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
                    item_type: 'PRODUCT_ITEM', // MANDATORY FIX
                    status: 'active',
                    checkout_url: `${frontendUrl}/product/${p.slug}`
                }
            };
        });

        // Split into batches of 100 if necessary (Meta limit is higher, but 100 is safe)
        const batchSize = 100;
        let totalProcessed = 0;
        let lastHandle = '';

        for (let i = 0; i < requests.length; i += batchSize) {
            const currentBatch = requests.slice(i, i + batchSize);
            
            const response = await fetch(`https://graph.facebook.com/v19.0/${settings.metaCatalogId}/items_batch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.metaAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    allow_upsert: true,
                    requests: currentBatch 
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.error?.error_user_msg || result.error?.message || 'Meta API rejected the batch';
                throw new Error(`META_API_REJECTED: ${errorDetail}`);
            }
            
            lastHandle = result.handles?.[0] || lastHandle;
            totalProcessed += currentBatch.length;
        }

        log.status = 'success';
        log.processedCount = totalProcessed;
        await log.save();

        res.json({ 
            success: true, 
            message: `Successfully synchronized ${totalProcessed} products with Meta Catalog.`,
            handle: lastHandle
        });

    } catch (error) {
        console.error("Meta Sync Process Failed:", error.message);
        log.status = 'failed';
        log.error = error.message;
        await log.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/sync-logs', protect, admin, async (req, res) => {
    try {
        const logs = await SyncLog.find({ service: 'meta-catalog' })
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to load logs" });
    }
});

module.exports = router;
