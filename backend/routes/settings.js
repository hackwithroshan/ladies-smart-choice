
const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const { protect, admin } = require('../middleware/authMiddleware');

// Get Settings
router.get('/site', async (req, res) => {
    try {
        let s = await SiteSettings.findOne();
        if (!s) s = await SiteSettings.create({});
        res.json(s);
    } catch (e) { res.status(500).json({ message: 'Error fetching settings' }); }
});

// Update Settings (Deep Validation for Meta Storage)
router.put('/site', protect, admin, async (req, res) => {
    try {
        const updateData = {
            storeName: req.body.storeName,
            primaryColor: req.body.primaryColor,
            accentColor: req.body.accentColor,
            fontFamily: req.body.fontFamily,
            checkoutMode: req.body.checkoutMode,
            whatsappNumber: req.body.whatsappNumber,
            whatsappMessage: req.body.whatsappMessage,
            // Meta Fields - CRITICAL EXPLICIT MAPPING
            metaPixelId: req.body.metaPixelId,
            metaCatalogId: req.body.metaCatalogId,
            metaAccessToken: req.body.metaAccessToken,
            trackPageView: req.body.trackPageView,
            trackAddToCart: req.body.trackAddToCart,
            trackPurchase: req.body.trackPurchase,
            isMaintenanceMode: req.body.isMaintenanceMode
        };
        
        // Use findOneAndUpdate with upsert to ensure a record always exists
        const s = await SiteSettings.findOneAndUpdate({}, { $set: updateData }, { new: true, upsert: true });
        res.json(s);
    } catch (e) { 
        console.error("Settings Update Error:", e);
        res.status(500).json({ message: 'Failed to update configuration' }); 
    }
});

module.exports = router;
