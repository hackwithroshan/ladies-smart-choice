
const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { protect, admin } = require('../middleware/authMiddleware');

// Endpoint to track events from the frontend
router.post('/track', async (req, res) => {
    try {
        const event = new AnalyticsEvent(req.body);
        await event.save();
        res.status(201).send();
    } catch (error) {
        res.status(400).send();
    }
});

// Endpoint for the admin analytics dashboard
router.get('/summary', protect, admin, async (req, res) => {
    // This is a placeholder for a real analytics aggregation pipeline.
    // A real implementation would use MongoDB aggregation framework for performance.
    const MOCK_DATA = {
        totalVisitors: 12450,
        adRevenue: 85600,
        conversionRate: 2.3,
        topSource: 'Meta Ads',
        trafficSources: [
            { name: 'meta', value: 400 },
            { name: 'google', value: 300 },
            { name: 'organic', value: 200 },
            { name: 'direct', value: 100 },
        ],
        revenueOverTime: [
            { date: 'Day 1', meta: 4000, google: 2400, organic: 1200, direct: 800 },
            { date: 'Day 2', meta: 3000, google: 1398, organic: 1000, direct: 900 },
            { date: 'Day 3', meta: 2000, google: 9800, organic: 2200, direct: 500 },
            { date: 'Day 4', meta: 2780, google: 3908, organic: 1500, direct: 1100 },
            { date: 'Day 5', meta: 1890, google: 4800, organic: 1800, direct: 700 },
            { date: 'Day 6', meta: 2390, google: 3800, organic: 2500, direct: 1200 },
            { date: 'Day 7', meta: 3490, google: 4300, organic: 2100, direct: 600 },
        ],
        topPages: [
            { path: '/', views: 25000 },
            { path: '/product/floral-summer-maxi-dress', views: 8900 },
            { path: '/collections/summer-collection', views: 5600 },
        ]
    };
    res.json(MOCK_DATA);
});

module.exports = router;
