
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

// --- Generate Facebook CSV Feed ---
router.get('/facebook.csv', async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' });
        const headers = 'id,title,description,availability,condition,price,link,image_link,brand';
        const rows = products.map(p => {
            const price = `${p.price} INR`;
            // Basic CSV escaping for description
            const description = `"${(p.shortDescription || p.description).replace(/"/g, '""')}"`;
            const link = `${process.env.FRONTEND_URL || 'https://your-store.com'}/product/${p.slug}`; // Use env variable
            return [p.sku || p._id, p.name, description, 'in stock', 'new', price, link, p.imageUrl, p.brand || 'Ladies Smart Choice'].join(',');
        });
        const csv = [headers, ...rows].join('\n');
        res.header('Content-Type', 'text/csv');
        res.attachment('facebook_product_feed.csv');
        return res.send(csv);
    } catch (e) {
        res.status(500).send('Error generating feed');
    }
});

// --- Meta Catalog Sync ---
router.post('/sync-meta-catalog', protect, admin, async (req, res) => {
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
            const requests = batch.map(product => ({
                method: 'UPDATE',
                data: {
                    retailer_id: product.sku || product._id.toString(),
                    name: product.name,
                    description: product.shortDescription || product.description,
                    url: `${process.env.FRONTEND_URL || 'https://your-store.com'}/product/${product.slug}`, // Use env variable
                    image_url: product.imageUrl,
                    price: product.price,
                    currency: 'INR',
                    availability: product.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
                    condition: 'NEW',
                    brand: product.brand || 'Ladies Smart Choice'
                }
            }));

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