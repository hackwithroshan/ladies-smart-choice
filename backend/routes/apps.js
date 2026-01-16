const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const { protect, admin } = require('../middleware/authMiddleware');
const { generateFeedFiles } = require('../utils/feedGenerator');

// Get Apps Status
router.get('/status', protect, admin, async (req, res) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings) return res.json({ meta: false, google: false });

        res.json({
            meta: {
                connected: settings.metaAdsConnected,
                pixelId: settings.metaPixelId,
                lastSync: settings.metaLastSync
            },
            google: {
                connected: settings.googleAdsConnected,
                adsId: settings.googleAdsId
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching status' });
    }
});

// Connect Meta
router.post('/meta/connect', protect, admin, async (req, res) => {
    try {
        const { pixelId, accessToken, businessId } = req.body;

        // In a real app, validation logic would go here (Test API call)

        const settings = await SiteSettings.findOneAndUpdate({}, {
            metaPixelId: pixelId,
            metaAccessToken: accessToken,
            metaBusinessId: businessId,
            metaAdsConnected: true
        }, { new: true, upsert: true });

        // Trigger Sync immediately
        generateFeedFiles().catch(console.error);

        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ message: 'Meta Connection Failed' });
    }
});

// Sync Meta Catalog
router.post('/meta/sync', protect, admin, async (req, res) => {
    try {
        await generateFeedFiles();
        await SiteSettings.findOneAndUpdate({}, { metaLastSync: new Date() });
        res.json({ success: true, message: 'Catalog sync started' });
    } catch (err) {
        res.status(500).json({ message: 'Sync Failed' });
    }
});

// Connect Google
router.post('/google/connect', protect, admin, async (req, res) => {
    try {
        const { adsId, conversionLabel, merchantId } = req.body;

        const settings = await SiteSettings.findOneAndUpdate({}, {
            googleAdsId: adsId,
            googleConversionLabel: conversionLabel || '',
            googleMerchantId: merchantId || '',
            googleAdsConnected: true
        }, { new: true, upsert: true });

        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ message: 'Google Connection Failed' });
    }
});

// Disconnect
router.post('/:app/disconnect', protect, admin, async (req, res) => {
    try {
        const { app } = req.params;
        const update = app === 'meta'
            ? {
                metaAdsConnected: false,
                metaPixelId: '',
                metaAccessToken: '',
                metaBusinessId: '',
                metaCatalogId: '',
                metaLastSync: null
            }
            : { googleAdsConnected: false, googleAdsId: '' };

        const settings = await SiteSettings.findOneAndUpdate({}, update, { new: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Disconnect Failed' });
    }
});

module.exports = router;
