
const express = require('express');
const router = express.Router();

// Import all necessary models
const Product = require('../models/Product');
const Category = require('../models/Category');
const HeaderSetting = require('../models/HeaderSetting');
const FooterSetting = require('../models/FooterSetting');
const SiteSettings = require('../models/SiteSettings');
const HomePageSetting = require('../models/HomePageSetting');
const Slide = require('../models/Slide');
const Collection = require('../models/Collection');
const ShoppableVideo = require('../models/ShoppableVideo');
const Testimonial = require('../models/Testimonial');

router.get('/', async (req, res) => {
    try {
        const [
            products,
            categories,
            headerSettings,
            footerSettings,
            siteSettings,
            homePageSettings,
            slides,
            collections,
            videos,
            testimonials
        ] = await Promise.all([
            Product.find({ status: 'Active' }).sort({ _id: -1 }),
            Category.find({}),
            HeaderSetting.findOne(),
            FooterSetting.findOne(),
            SiteSettings.findOne(),
            HomePageSetting.findOne(),
            Slide.find({}),
            Collection.find({ isActive: true }),
            ShoppableVideo.find({}),
            Testimonial.find({})
        ]);

        res.json({
            products,
            categories,
            headerSettings,
            footerSettings,
            siteSettings,
            homePageSettings,
            slides,
            collections,
            videos,
            testimonials
        });
    } catch (error) {
        console.error('Error fetching app data:', error);
        res.status(500).json({ message: 'Server error while fetching app data.' });
    }
});

module.exports = router;
