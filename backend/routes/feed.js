
const express = require('express');
const router = express.Router();
// FIX: Ensure the Product model is imported to prevent 'Product is not defined' error.
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');
const { generateFeedFiles } = require('../utils/feedGenerator');

// This file is now mounted at /api/catalog

// --- Manual Feed Generation ---
router.post('/generate-feeds', protect, admin, async (req, res) => {
    try {
        await generateFeedFiles();
        res.status(200).json({ message: "Product feeds (CSV and XML) generated successfully." });
    } catch (error) {
        console.error('Manual feed generation failed:', error);
        res.status(500).json({ message: "Failed to generate product feeds." });
    }
});


// --- Meta Catalog Sync ---
router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken || !settings.metaCatalogId) {
            throw new Error('Meta Access Token or Catalog ID not configured in settings.');
        }

        const products = await Product.find({ status: 'Active' });
        const BATCH_SIZE = 50; // Meta API limit
        let processedCount = 0;

        for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const batch = products.slice(i, i + BATCH_SIZE);
            const requests = batch.map(product => {
                const data = {
                    retailer_id: product.sku || product._id.toString(),
                    name: product.name,
                    description: product.shortDescription || product.description,
                    url: `${process.env.FRONTEND_URL || 'https://ladiessmartchoice.com'}/product/${product.slug}`,
                    image_url: product.imageUrl,
                    currency: 'INR',
                    availability: product.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
                    condition: 'NEW',
                    brand: product.brand || 'Ladies Smart Choice'
                };

                // Handle sale price correctly
                if (product.mrp && product.mrp > product.price) {
                    data.price = product.mrp;
                    data.sale_price = product.price;
                } else {
                    data.price = product.price;
                }
                
                return {
                    method: 'UPDATE',
                    data: data
                };
            });

            const response = await fetch(`https://graph.facebook.com/v19.0/${settings.metaCatalogId}/batch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.metaAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: JSON.stringify(requests),
                    item_type: 'PRODUCT_ITEM'
                })
            });

            const responseData = await response.json();
            if (!response.ok) {
                 throw new Error(`Meta API Error: ${responseData.error?.message || 'Unknown error'}`);
            }
            processedCount += batch.length;
        }

        log.status = 'success';
        log.processedCount = processedCount;
        await log.save();
        res.json({ message: 'Catalog sync completed successfully!', status: log });

    } catch (error) {
        log.status = 'failed';
        log.error = error.message;
        await log.save();
        console.error('Meta Sync Error:', error);
        res.status(500).json({ message: error.message, status: log });
    }
});

// Get Sync Logs
router.get('/sync-logs', protect, admin, async (req, res) => {
    try {
        const logs = await SyncLog.find({}).sort({ timestamp: -1 }).limit(10);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching logs' });
    }
});

module.exports = router;