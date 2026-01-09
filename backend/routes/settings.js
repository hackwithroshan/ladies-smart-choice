
const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const HomePageSetting = require('../models/HomePageSetting');
const HomepageLayout = require('../models/HomepageLayout');
const PageLayout = require('../models/PageLayout');
const HeaderSetting = require('../models/HeaderSetting');
const FooterSetting = require('../models/FooterSetting');
const { protect, admin } = require('../middleware/authMiddleware');

// --- 1. SITE BRANDING & GLOBAL CONFIG ---
router.get('/site', async (req, res) => {
    try {
        let s = await SiteSettings.findOne();
        if (!s) {
            s = await SiteSettings.create({
                storeName: 'Ayushree Ayurveda',
                primaryColor: '#16423C',
                accentColor: '#6A9C89',
                checkoutMode: 'standard'
            });
        }
        res.json(s);
    } catch (e) { 
        res.status(500).json({ message: 'Error fetching global settings' }); 
    }
});

router.put('/site', protect, admin, async (req, res) => {
    try {
        // Validation for checkout mode
        if (req.body.checkoutMode && !['standard', 'magic'].includes(req.body.checkoutMode)) {
            return res.status(400).json({ message: 'Invalid checkout strategy' });
        }
        
        const s = await SiteSettings.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });
        res.json(s);
    } catch (e) { 
        res.status(500).json({ message: 'Failed to update system configuration' }); 
    }
});

// --- 2. HOMEPAGE SEO SETTINGS ---
router.get('/homepage', async (req, res) => {
    try {
        let s = await HomePageSetting.findOne();
        if (!s) s = await HomePageSetting.create({ seoTitle: 'Ayushree Ayurveda', seoKeywords: [] });
        res.json(s);
    } catch (e) { res.status(500).json({ message: 'Error fetching SEO settings' }); }
});

router.put('/homepage', protect, admin, async (req, res) => {
    try {
        const s = await HomePageSetting.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });
        res.json(s);
    } catch (e) { res.status(500).json({ message: 'Failed to update SEO settings' }); }
});

// Other settings remains same...
router.get('/header', async (req, res) => {
    try {
        let h = await HeaderSetting.findOne();
        if (!h) h = await HeaderSetting.create({ logoText: 'Ayushree Ayurveda' });
        res.json(h);
    } catch (e) { res.status(500).json({ message: 'Error fetching header settings' }); }
});

router.put('/header', protect, admin, async (req, res) => {
    try {
        const h = await HeaderSetting.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });
        res.json(h);
    } catch (e) { res.status(500).json({ message: 'Failed to update header settings' }); }
});

router.get('/footer', async (req, res) => {
    try {
        let f = await FooterSetting.findOne();
        if (!f) f = await FooterSetting.create({ brandDescription: 'Ayurvedic Wellness Store' });
        res.json(f);
    } catch (e) { res.status(500).json({ message: 'Error fetching footer settings' }); }
});

router.put('/footer', protect, admin, async (req, res) => {
    try {
        const f = await FooterSetting.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });
        res.json(f);
    } catch (e) { res.status(500).json({ message: 'Failed to update footer settings' }); }
});

router.get('/layout', async (req, res) => {
    try {
        let l = await HomepageLayout.findOne();
        if (!l) return res.json({ sections: [] });
        res.json(l);
    } catch (e) { res.status(500).json({ sections: [] }); }
});

router.put('/layout', protect, admin, async (req, res) => {
    try {
        const l = await HomepageLayout.findOneAndUpdate({}, { $set: { sections: req.body.sections } }, { new: true, upsert: true });
        res.json(l);
    } catch (e) { res.status(500).json({ message: 'Failed to publish layout' }); }
});

router.get('/pdp-layout/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        let l = await PageLayout.findOne({ productId });
        if (!l && productId !== 'global') {
            l = await PageLayout.findOne({ productId: 'global' });
        }
        res.json(l || { productId, sections: [] });
    } catch (e) { res.status(500).json({ message: 'Error fetching PDP layout' }); }
});

router.put('/pdp-layout/:productId', protect, admin, async (req, res) => {
    try {
        const l = await PageLayout.findOneAndUpdate(
            { productId: req.params.productId },
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.json(l);
    } catch (e) { res.status(500).json({ message: 'Failed to save PDP layout' }); }
});

module.exports = router;
