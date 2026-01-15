
const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const HomePageSetting = require('../models/HomePageSetting');
const HeaderSetting = require('../models/HeaderSetting');
const FooterSetting = require('../models/FooterSetting');
const StoreDetails = require('../models/StoreDetails');
const PageLayout = require('../models/PageLayout');
const HomepageLayout = require('../models/HomepageLayout');
const { protect, admin } = require('../middleware/authMiddleware');

// --- Layout Management (Visual Builder) ---

router.get('/layout', async (req, res) => {
    try {
        let layout = await HomepageLayout.findOne();
        if (!layout) {
            layout = await HomepageLayout.create({ sections: [] });
        }
        res.json(layout);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.put('/layout', protect, admin, async (req, res) => {
    try {
        const layout = await HomepageLayout.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(layout);
    } catch (e) { res.status(500).json({ message: 'Save Failed' }); }
});

router.get('/pdp-layout/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        let layout = await PageLayout.findOne({ productId });
        if (!layout && productId !== 'global') {
            layout = await PageLayout.findOne({ productId: 'global' });
        }
        if (!layout) {
            return res.json({ productId: 'global', sections: [] });
        }
        res.json(layout);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.put('/pdp-layout/:productId', protect, admin, async (req, res) => {
    try {
        const layout = await PageLayout.findOneAndUpdate(
            { productId: req.params.productId },
            req.body,
            { new: true, upsert: true }
        );
        res.json(layout);
    } catch (e) { res.status(500).json({ message: 'Save Failed' }); }
});

// --- Store Brand & Identity ---

router.get('/site', async (req, res) => {
    try {
        let s = await SiteSettings.findOne();
        if (!s) s = await SiteSettings.create({});
        res.json(s);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.put('/site', protect, admin, async (req, res) => {
    try {
        const s = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(s);
    } catch (e) { res.status(500).json({ message: 'Update Failed' }); }
});

router.get('/store-details', async (req, res) => {
    try {
        let d = await StoreDetails.findOne();
        if (!d) d = await StoreDetails.create({});
        res.json(d);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.put('/store-details', protect, admin, async (req, res) => {
    try {
        const d = await StoreDetails.findOneAndUpdate({}, req.body, { new: true, upsert: true });

        // Sync Phone Number with Header
        if (req.body.contactPhone) {
            await HeaderSetting.findOneAndUpdate({}, { phoneNumber: req.body.contactPhone }, { upsert: true });
        }

        res.json(d);
    } catch (e) { res.status(500).json({ message: 'Update Failed' }); }
});

// --- Menu & Header/Footer ---

router.get('/header', async (req, res) => {
    try {
        let h = await HeaderSetting.findOne();
        if (!h) h = await HeaderSetting.create({});
        res.json(h);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.put('/header', protect, admin, async (req, res) => {
    try {
        const h = await HeaderSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(h);
    } catch (e) { res.status(500).json({ message: 'Update Failed' }); }
});

router.get('/footer', async (req, res) => {
    try {
        let f = await FooterSetting.findOne();
        if (!f) f = await FooterSetting.create({});
        res.json(f);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.put('/footer', protect, admin, async (req, res) => {
    try {
        const f = await FooterSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(f);
    } catch (e) { res.status(500).json({ message: 'Update Failed' }); }
});

module.exports = router;
