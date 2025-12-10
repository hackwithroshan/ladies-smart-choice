
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

const HeaderSetting = require('../models/HeaderSetting');
const FooterSetting = require('../models/FooterSetting');
const SiteSettings = require('../models/SiteSettings');
const HomePageSetting = require('../models/HomePageSetting');
const StoreDetails = require('../models/StoreDetails');

// --- Header Settings ---
router.get('/header', async (req, res) => {
    const settings = await HeaderSetting.findOne();
    res.json(settings || {});
});

router.put('/header', protect, admin, async (req, res) => {
    const settings = await HeaderSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});

// --- Footer Settings ---
router.get('/footer', async (req, res) => {
    const settings = await FooterSetting.findOne();
    res.json(settings || {});
});

router.put('/footer', protect, admin, async (req, res) => {
    const settings = await FooterSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});

// --- Site-wide Settings ---
router.get('/site', async (req, res) => {
    const settings = await SiteSettings.findOne();
    res.json(settings || {});
});

router.put('/site', protect, admin, async (req, res) => {
    const settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});

// --- Home Page SEO Settings ---
router.get('/homepage', async (req, res) => {
    const settings = await HomePageSetting.findOne();
    res.json(settings || {});
});

router.put('/homepage', protect, admin, async (req, res) => {
    const settings = await HomePageSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
});

// --- NEW: Store Business Details ---
router.get('/store-details', async (req, res) => {
    const details = await StoreDetails.findOne();
    res.json(details || {});
});

router.put('/store-details', protect, admin, async (req, res) => {
    const details = await StoreDetails.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(details);
});

module.exports = router;
