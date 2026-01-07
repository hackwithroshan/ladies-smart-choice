
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

// Meta Catalog Sync API - Deep Tested logic
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        // 1. Database se fresh credentials uthao
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('CONFIGURATION_MISSING: Dashboard > Marketing mein Catalog ID aur Token save karein.');
        }

        // 2. Sirf Active Products sync karein
        const products = await Product.find({ status: 'Active' });
        if (products.length === 0) throw new Error('DATA_EMPTY: Database mein koi active product nahi mila.');

        const frontendUrl = 'https://ayushreeayurveda.in'; // Aapka production domain

        // 3. Meta Batch Request Payload (Strict v19.0 Format)
        const requests = products.map(p => ({
            method: 'UPDATE',
            retailer_id: p.sku || p._id.toString(), // Unique ID for Meta
            data: {
                name: p.name,
                description: (p.shortDescription || p.description || p.name).substring(0, 4900),
                url: `${frontendUrl}/product/${p.slug}`,
                image_url: p.imageUrl,
                brand: p.brand || settings.storeName || 'Ayushree Ayurveda',
                inventory: Math.max(0, p.stock),
                condition: 'new',
                price: Math.round(p.price), // Meta strict integer check
                currency: 'INR',
                availability: p.stock > 0 ? 'in stock' : 'out of stock' // Meta standard strings
            }
        }));

        // 4. API Dispatch with Authorization Header
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
            const errorMsg = result.error?.message || 'Meta API Authorization error';
            throw new Error(errorMsg);
        }

        // Success Log
        log.status = 'success';
        log.processedCount = products.length;
        await log.save();

        res.json({ 
            success: true, 
            message: `SYNC SUCCESS: ${products.length} products successfully pushed to Meta.`,
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
