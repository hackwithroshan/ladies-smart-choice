
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Discount = require('../models/Discount');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get dashboard summary
router.get('/dashboard-summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        const [orders, customers, logs] = await Promise.all([
            Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
            User.find({ role: 'User', joinDate: { $gte: start, $lte: end } }),
            ActivityLog.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(10)
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

        res.json({
            kpis: {
                totalRevenue: { value: totalRevenue, growth: 12.5 },
                totalOrders: { value: orders.length, growth: 8.2 },
                newCustomers: { value: customers.length, growth: 4.1 },
                avgOrderValue: { value: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0, growth: 2.3 }
            },
            logs: logs.map(l => ({
                userName: l.userName || 'System',
                action: l.action,
                target: l.target,
                details: l.details,
                createdAt: l.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Dashboard summary failed' });
    }
});

// @desc    Get detailed analytics
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const [orders, events] = await Promise.all([
            Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
            AnalyticsEvent.find({ createdAt: { $gte: start, $lte: end } })
        ]);

        const visitorsCount = events.filter(e => e.eventType === 'PageView').length || 1;
        const salesTotal = orders.reduce((sum, o) => sum + o.total, 0);

        const funnel = {
            visitors: visitorsCount,
            addToCart: events.filter(e => e.eventType === 'AddToCart').length,
            checkout: events.filter(e => e.eventType === 'InitiateCheckout').length,
            purchased: orders.length
        };

        // Aggregating Top Pages for the period
        const pageCounts = {};
        events.forEach(e => { if(e.path) pageCounts[e.path] = (pageCounts[e.path] || 0) + 1 });
        const topPages = Object.entries(pageCounts)
            .map(([path, views]) => ({ path, views }))
            .sort((a,b) => b.views - a.views)
            .slice(0, 10);

        res.json({
            kpis: { visitors: visitorsCount, sales: salesTotal, orders: orders.length, conversionRate: ((orders.length / visitorsCount) * 100).toFixed(2) },
            funnel,
            topPages,
            timeSeries: [
                { date: 'Mon', visitors: 400, sales: 2400 },
                { date: 'Tue', visitors: 300, sales: 1398 },
                { date: 'Wed', visitors: 200, sales: 9800 },
                { date: 'Thu', visitors: 278, sales: 3908 },
                { date: 'Fri', visitors: 189, sales: 4800 },
                { date: 'Sat', visitors: 239, sales: 3800 },
                { date: 'Sun', visitors: 349, sales: 4300 },
            ],
            revenueBySource: [
                { name: 'meta', value: salesTotal * 0.4 },
                { name: 'google', value: salesTotal * 0.3 },
                { name: 'organic', value: salesTotal * 0.2 },
                { name: 'direct', value: salesTotal * 0.1 }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: 'Detailed analytics failed' });
    }
});

// @desc    Get ADVANCED live traffic data
router.get('/live', protect, admin, async (req, res) => {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const liveEvents = await AnalyticsEvent.find({ createdAt: { $gt: tenMinutesAgo } }).sort({ createdAt: -1 });

        // Group by Page
        const activePages = {};
        // Group by Source
        const sources = { meta: 0, google: 0, organic: 0, direct: 0, referral: 0 };
        
        liveEvents.forEach(e => {
            if (e.path) activePages[e.path] = (activePages[e.path] || 0) + 1;
            if (e.source) sources[e.source] = (sources[e.source] || 0) + 1;
        });

        res.json({ 
            activeUsers: liveEvents.length, 
            activePages: Object.entries(activePages).map(([path, count]) => ({ path, count })).sort((a,b) => b.count - a.count).slice(0, 5),
            sources,
            recentEvents: liveEvents.slice(0, 15) 
        });
    } catch (error) {
        res.status(500).json({ message: 'Live data fetch failed' });
    }
});

// @desc    Track user events
router.post('/track', async (req, res) => {
    try {
        const { eventType, path, source, utm, eventId } = req.body;
        await AnalyticsEvent.create({ eventType, path, source, utm, data: req.body.data });
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(200).json({ status: 'error' });
    }
});

module.exports = router;
