
const express = require('express');
const router = express.Router();

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
        // Fetch everything in parallel with fallbacks to empty arrays if queries fail
        const results = await Promise.allSettled([
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

        const data = {
            products: results[0].status === 'fulfilled' ? results[0].value : [],
            categories: results[1].status === 'fulfilled' ? results[1].value : [],
            headerSettings: results[2].status === 'fulfilled' ? results[2].value : {},
            footerSettings: results[3].status === 'fulfilled' ? results[3].value : {},
            siteSettings: results[4].status === 'fulfilled' ? results[4].value : {},
            homePageSettings: results[5].status === 'fulfilled' ? results[5].value : {},
            slides: results[6].status === 'fulfilled' ? results[6].value : [],
            collections: results[7].status === 'fulfilled' ? results[7].value : [],
            videos: results[8].status === 'fulfilled' ? results[8].value : [],
            testimonials: results[9].status === 'fulfilled' ? results[9].value : []
        };

        res.json(data);
    } catch (error) {
        console.error('Critical Error in app-data route:', error);
        res.status(500).json({ message: 'Internal Server Error while loading store data.' });
    }
});

module.exports = router;
