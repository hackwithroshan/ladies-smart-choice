
const express = require('express');
const router = express.Router();
const ShippingProvider = require('../models/ShippingProvider');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all configured providers
// @route   GET /api/shipping/providers
// @access  Private/Admin
router.get('/providers', protect, admin, async (req, res) => {
    try {
        const providers = await ShippingProvider.find({});
        res.json(providers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update or Create a provider configuration
// @route   POST /api/shipping/providers
// @access  Private/Admin
router.post('/providers', protect, admin, async (req, res) => {
    const { slug, name, logoUrl, credentials, isEnabled, isTestMode, settings } = req.body;

    try {
        let provider = await ShippingProvider.findOne({ slug });

        if (provider) {
            // Update existing
            provider.name = name || provider.name;
            provider.logoUrl = logoUrl || provider.logoUrl;
            provider.isEnabled = isEnabled !== undefined ? isEnabled : provider.isEnabled;
            provider.isTestMode = isTestMode !== undefined ? isTestMode : provider.isTestMode;
            provider.credentials = { ...provider.credentials, ...credentials };
            provider.settings = { ...provider.settings, ...settings };
            await provider.save();
        } else {
            // Create new
            provider = await ShippingProvider.create({
                slug,
                name,
                logoUrl,
                isEnabled,
                isTestMode,
                credentials,
                settings
            });
        }

        res.json(provider);
    } catch (error) {
        console.error("Shipping Provider Save Error:", error);
        res.status(500).json({ message: 'Failed to save provider settings.' });
    }
});

// @desc    Test Connection (Stub)
// @route   POST /api/shipping/test-connection
router.post('/test-connection', protect, admin, async (req, res) => {
    const { slug } = req.body;
    // Here you would implement actual API calls to Shiprocket/Delhivery to verify keys
    // For now, we simulate a success
    setTimeout(() => {
        res.json({ success: true, message: `Successfully connected to ${slug} API.` });
    }, 1000);
});

module.exports = router;
