
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

/**
 * META CATALOG INTELLIGENCE ENGINE (AUDITED v2.2)
 * Features: Auto-Repair, HTML Scrubbing, Absolute URL Resolution
 */
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('CONFIG_ERROR: Meta Catalog ID or Access Token is missing from system settings.');
        }

        const products = await Product.find({ status: 'Active' });
        if (products.length === 0) throw new Error('DATA_EMPTY: No active products found for sync.');

        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        /**
         * VALIDATION & SANITIZATION PIPELINE
         * Automatically repairs common Meta API rejection causes
         */
        const requests = products.map(p => {
            const retailerId = p.sku || p._id.toString();

            // 1. Absolute URL Enforcement (Meta rejects relative paths)
            const productLink = p.slug ? `${frontendUrl}/product/${p.slug}` : `${frontendUrl}`;
            let imageLink = p.imageUrl || '';
            if (imageLink && !imageLink.startsWith('http')) {
                imageLink = `${frontendUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
            }

            // 2. HTML Content Scrubbing (Meta rejects items with <div>, <p> tags)
            const sanitizedDescription = (p.shortDescription || p.description || p.name)
                .replace(/<[^>]*>?/gm, '') // Remove all HTML
                .replace(/\s+/g, ' ')      // Collapse whitespace
                .trim()
                .substring(0, 4900);      // Safety margin under 5000 limit

            // 3. Price Architecture (Meta requires "NUMBER CURRENCY" string)
            const formattedPrice = `${Math.round(p.price || 0)} INR`;

            // 4. Shopify-style Category Mapping (Breadcrumbs)
            const breadcrumb = p.category ? `${p.category} > ${p.name}` : 'General Wellness';

            return {
                method: 'UPDATE',
                retailer_id: retailerId,
                data: {
                    id: retailerId,
                    title: p.name.trim().substring(0, 150),
                    description: sanitizedDescription,
                    availability: (p.stock && p.stock > 0) ? 'in stock' : 'out of stock',
                    condition: 'new',
                    price: formattedPrice,
                    link: productLink,
                    image_link: imageLink,
                    brand: p.brand || settings.storeName || 'Ayushree',
                    item_group_id: p.category ? p.category.toLowerCase().replace(/\s+/g, '_') : 'global_group',
                    product_type: breadcrumb,
                    google_product_category: 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',
                    item_type: 'PRODUCT_ITEM', // CRITICAL: Mandatory for e-commerce catalogs
                    status: 'active',
                    checkout_url: productLink
                }
            };
        });

        // Split into batches of 1000 (Meta API Limit)
        const batchSize = 1000;
        let totalSynced = 0;
        let batchHandles = [];

        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            
            const response = await fetch(`https://graph.facebook.com/v21.0/${settings.metaCatalogId}/items_batch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.metaAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    allow_upsert: true,
                    requests: batch 
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Meta Batch Rejection:", JSON.stringify(result, null, 2));
                throw new Error(result.error?.error_user_msg || result.error?.message || 'Meta API rejected the sync batch');
            }
            
            totalSynced += batch.length;
            if (result.handles) batchHandles.push(result.handles[0]);
        }

        log.status = 'success';
        log.processedCount = totalSynced;
        await log.save();

        res.json({ 
            success: true, 
            message: `Successfully validated and pushed ${totalSynced} products to Meta Business Suite.`,
            handles: batchHandles
        });

    } catch (error) {
        console.error("CATALOG_SYNC_FATAL:", error.message);
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
