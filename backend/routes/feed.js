const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

/**
 * META CATALOG SYNC ENGINE v3.4 (STRICT GRAPH API COMPLIANCE)
 * Resolves: (#100) The parameter item_type is required
 * Optimized for: ladiessmartchoice.com
 */
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings?.metaAccessToken || !settings?.metaCatalogId) {
            throw new Error('Meta Catalog ID or Access Token missing in Store Settings.');
        }

        const products = await Product.find({ status: 'Active' });
        if (!products.length) throw new Error('No active products found in database.');

        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        // Mapping to Meta Commerce Strict Schema
        const requests = products.map(p => {
            // Validate essential fields to prevent partial sync failure
            if (!p.name || !p.imageUrl || !p.price) return null;

            const retailerId = p.sku || p._id.toString();

            // 1. STRIP HTML & SANITIZE DESCRIPTION (Meta strict requirement)
            const cleanDescription = (p.shortDescription || p.description || p.name)
                .replace(/<[^>]*>?/gm, '')       // Remove HTML tags
                .replace(/[^\x00-\x7F]/g, "")    // Remove non-ASCII characters
                .replace(/[\r\n]+/gm, ' ')       // Remove line breaks
                .replace(/\s+/g, ' ')            // Remove excessive spaces
                .trim()
                .substring(0, 4500);

            // 2. NORMALIZE ABSOLUTE URLs (Meta rejects relative paths)
            const productLink = `${frontendUrl}/product/${p.slug}`;
            let imageLink = p.imageUrl;
            if (!imageLink.startsWith('http')) {
                imageLink = `${frontendUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
            }

            // 3. FORMAT PRICE (Meta strictly requires "VALUE CURRENCY" string)
            const priceString = `${Math.round(p.price)} INR`;

            // 4. CATEGORY CLEANING
            const safeCategory = (p.category || 'Health & Beauty')
                .replace(/[^a-zA-Z0-9 >]/g, '')
                .substring(0, 250);

            return {
                method: 'UPDATE',
                retailer_id: retailerId,
                data: {
                    // 🔥 MANDATORY FIELD FOR Graph API v21.0+
                    item_type: 'PRODUCT_ITEM', 
                    
                    id: retailerId,
                    title: p.name.substring(0, 140).trim(),
                    description: cleanDescription || p.name,
                    availability: (p.stock && p.stock > 0) ? 'in stock' : 'out of stock',
                    condition: 'new',
                    price: priceString,
                    link: productLink,
                    image_link: imageLink,
                    brand: p.brand || settings.storeName || 'Ayushree',
                    
                    // TARGETING METADATA
                    product_type: safeCategory,
                    google_product_category: 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',
                    
                    // VISIBILITY
                    status: 'active'
                }
            };
        }).filter(Boolean); // Clear any null entries from validation failures

        if (requests.length === 0) {
            throw new Error('Zero valid products found to sync. Check image URLs and Prices.');
        }

        // BATCH PROCESSING (Meta limit is 1000, we use 500 for safety)
        const batchSize = 500;
        let totalProcessed = 0;

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
                console.error("META_SYNC_REJECTED:", JSON.stringify(result, null, 2));
                throw new Error(result.error?.message || 'Meta API rejected the batch data.');
            }
            
            totalProcessed += batch.length;
        }

        log.status = 'success';
        log.processedCount = totalProcessed;
        await log.save();

        res.json({ 
            success: true, 
            message: `Synchronized ${totalProcessed} products with Meta Business Suite successfully.`
        });

    } catch (error) {
        console.error("SYNC_FATAL_ERROR:", error.message);
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