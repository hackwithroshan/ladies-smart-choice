
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

const HeaderSetting = require('../models/HeaderSetting');
const FooterSetting = require('../models/FooterSetting');
const SiteSettings = require('../models/SiteSettings');
const HomePageSetting = require('../models/HomePageSetting');
const HomepageLayout = require('../models/HomepageLayout');

// --- Layout Editor ---
router.get('/layout', async (req, res) => {
    let layout = await HomepageLayout.findOne();
    if (!layout) {
        // Seed default order if none exists
        layout = await HomepageLayout.create({
            sections: [
                { id: 'hero-1', type: 'Hero', isActive: true },
                { id: 'coll-1', type: 'Collections', isActive: true },
                { id: 'new-1', type: 'NewArrivals', isActive: true },
                { id: 'vid-1', type: 'Videos', isActive: true },
                { id: 'best-1', type: 'BestSellers', isActive: true },
                { id: 'test-1', type: 'Testimonials', isActive: true },
                { id: 'news-1', type: 'Newsletter', isActive: true }
            ]
        });
    }
    res.json(layout);
});

router.put('/layout', protect, admin, async (req, res) => {
    const layout = await HomepageLayout.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(layout);
});

// ... (Rest of existing settings routes) ...
router.get('/header', async (req, res) => {
    const settings = await HeaderSetting.findOne();
    res.json(settings || {});
});
router.put('/header', protect, admin, async (req, res) => {
    const settings = await HeaderSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});
router.get('/footer', async (req, res) => {
    const settings = await FooterSetting.findOne();
    res.json(settings || {});
});
router.put('/footer', protect, admin, async (req, res) => {
    const settings = await FooterSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});
router.get('/site', async (req, res) => {
    const settings = await SiteSettings.findOne();
    res.json(settings || {});
});
router.put('/site', protect, admin, async (req, res) => {
    const settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});
router.get('/homepage', async (req, res) => {
    const settings = await HomePageSetting.findOne();
    res.json(settings || {});
});
router.put('/homepage', protect, admin, async (req, res) => {
    const settings = await HomePageSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});

module.exports = router;
