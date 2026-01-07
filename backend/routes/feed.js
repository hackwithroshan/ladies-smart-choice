
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

// @desc    Immediate Sync of Products to Meta Catalog API
// @route   POST /api/catalog/sync
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('Meta Catalog credentials missing. Please update settings.');
        }

        const products = await Product.find({ status: 'Active' });
        const frontendUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        // Prepare Meta Batch Request
        const requests = products.map(p => ({
            method: 'UPDATE',
            retailer_id: p.sku || p._id.toString(),
            data: {
                name: p.name,
                description: p.shortDescription || p.description,
                url: `${frontendUrl}/product/${p.slug}`,
                image_url: p.imageUrl,
                brand: p.brand || 'Ladies Smart Choice',
                inventory: p.stock,
                condition: 'new',
                price: Math.round(p.price * 100), // Meta expects price in minor units
                currency: 'INR',
                availability: p.stock > 0 ? 'in stock' : 'out of stock'
            }
        }));

        // Send to Meta Graph API
        const response = await fetch(`https://graph.facebook.com/v19.0/${settings.metaCatalogId}/batch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.metaAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Meta API returned an error.');
        }

        log.status = 'success';
        log.processedCount = products.length;
        await log.save();

        res.json({ 
            message: 'Real-time Catalog Sync Successful!', 
            processed: products.length,
            meta_handle: data.handle 
        });

    } catch (error) {
        log.status = 'failed';
        log.error = error.message;
        await log.save();
        res.status(500).json({ message: error.message });
    }
});

// @desc    Fetch logs to show Admin if sync is working
router.get('/sync-logs', protect, admin, async (req, res) => {
    const logs = await SyncLog.find().sort({ timestamp: -1 }).limit(5);
    res.json(logs);
});

module.exports = router;
