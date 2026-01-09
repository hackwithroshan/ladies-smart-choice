
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

/**
 * META CATALOG SYNC ENGINE v2.5 (STRICT AUDIT)
 * Targeted Fix: Resolves "(#100) The parameter item_type is required"
 */
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('Meta Credentials (Catalog ID/Token) missing in settings.');
        }

        const products = await Product.find({ status: 'Active' });
        if (products.length === 0) throw new Error('No active products found to sync.');

        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        /**
         * META BATCH REQUEST MAPPING
         * Strictly adheres to Meta Commerce "PRODUCT_ITEM" Schema
         */
        const requests = products.map(p => {
            const retailerId = p.sku || p._id.toString();

            // Sanitize Description: No HTML, no weird characters
            const cleanDescription = (p.shortDescription || p.description || p.name)
                .replace(/<[^>]*>?/gm, '') // Strip HTML tags
                .replace(/[\r\n]+/gm, ' ') // Remove line breaks
                .replace(/\s+/g, ' ')      // Remove multiple spaces
                .trim()
                .substring(0, 4500);

            // Ensure Absolute URLs
            const productLink = `${frontendUrl}/product/${p.slug}`;
            let imageLink = p.imageUrl || '';
            if (imageLink && !imageLink.startsWith('http')) {
                imageLink = `${frontendUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
            }

            // Standardized Price Format
            const priceString = `${Math.round(p.price)} INR`;

            return {
                method: 'UPDATE',
                retailer_id: retailerId,
                data: {
                    // REQUIRED FIELDS
                    id: retailerId,
                    title: p.name.substring(0, 140).trim(),
                    description: cleanDescription,
                    availability: (p.stock && p.stock > 0) ? 'in stock' : 'out of stock',
                    condition: 'new',
                    price: priceString,
                    link: productLink,
                    image_link: imageLink,
                    brand: p.brand || settings.storeName || 'Ayushree',
                    
                    // CATEGORY & TYPE (Critical for Meta Logic)
                    item_group_id: p.category ? p.category.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default_grp',
                    product_type: p.category || 'Ayurveda',
                    google_product_category: 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',
                    
                    // 🔥 THE FIX: item_type must be explicitly PRODUCT_ITEM
                    item_type: 'PRODUCT_ITEM', 
                    
                    // OPTIONAL BUT RECOMMENDED
                    status: 'active',
                    checkout_url: productLink,
                    currency: 'INR'
                }
            };
        });

        // Split into batches of 500 (Safer than 1000 for Meta Graph API stability)
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
                console.error("Meta API Rejected Batch:", JSON.stringify(result, null, 2));
                const errorMsg = result.error?.error_user_msg || result.error?.message || 'Meta API Rejection';
                throw new Error(`Meta Error: ${errorMsg}`);
            }
            
            totalProcessed += batch.length;
        }

        log.status = 'success';
        log.processedCount = totalProcessed;
        await log.save();

        res.json({ 
            success: true, 
            message: `Verified and synchronized ${totalProcessed} products with Meta Business Suite.`
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
