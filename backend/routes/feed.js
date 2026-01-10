
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const SyncLog = require('../models/SyncLog');
const { protect, admin } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

router.post('/sync', protect, admin, async (req, res) => {
    const log = new SyncLog({ service: 'meta-catalog', status: 'in_progress' });
    await log.save();

    try {
        const settings = await SiteSettings.findOne();
        if (!settings?.metaAccessToken || !settings?.metaCatalogId) {
            throw new Error('Meta Catalog ID or Access Token missing in Settings.');
        }

        const catalogId = settings.metaCatalogId.trim();
        const accessToken = settings.metaAccessToken.trim();
        const products = await Product.find({ status: 'Active' });

        const requests = products.map(p => {
            // Retailer ID used here must match Content IDs in tracking
            const retailerId = p.sku || p._id.toString();

            return {
                method: 'UPDATE',
                retailer_id: retailerId,
                data: {
                    item_type: 'PRODUCT_ITEM', 
                    id: retailerId,
                    title: p.name.trim(),
                    description: (p.shortDescription || p.name).replace(/<[^>]*>?/gm, '').trim(),
                    availability: (p.stock > 0) ? 'in stock' : 'out of stock',
                    condition: 'new',
                    price: `${Math.round(p.price)} INR`,
                    link: `https://ladiessmartchoice.com/product/${p.slug}`,
                    image_link: p.imageUrl,
                    brand: p.brand || 'Ayushree',
                    status: 'active'
                }
            };
        });

        const response = await fetch(`https://graph.facebook.com/v21.0/${catalogId}/items_batch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Meta rejected batch data.');
        }

        log.status = 'success';
        log.processedCount = requests.length;
        await log.save();

        res.json({ success: true, message: `Synced ${requests.length} products to Meta.` });

    } catch (error) {
        log.status = 'failed';
        log.error = error.message;
        await log.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
