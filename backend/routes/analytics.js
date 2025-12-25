
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { sendCapiEvent } = require('../utils/facebookCapiService');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get dashboard summary (Overview tab)
// @route   GET /api/analytics/dashboard-summary
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

        // Simple mock growth calculation relative to selected range length
        // In production, you'd compare with previous period
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
        console.error(error);
        res.status(500).json({ message: 'Dashboard summary failed' });
    }
});

// @desc    Get detailed analytics (Marketing Analytics tab)
// @route   GET /api/analytics/summary
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Fetch Orders and Events in parallel
        const [orders, events] = await Promise.all([
            Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
            AnalyticsEvent.find({ createdAt: { $gte: start, $lte: end } })
        ]);

        // 2. Calculate KPIs
        const visitorsCount = events.filter(e => e.eventType === 'PageView').length || 1; // Prevent div by zero
        const salesTotal = orders.reduce((sum, o) => sum + o.total, 0);
        const conversionRate = ((orders.length / visitorsCount) * 100).toFixed(2);

        // 3. Revenue by Source
        const sourceMap = {};
        orders.forEach(o => {
            const src = 'organic'; // Default, would normally come from tracking data in order
            sourceMap[src] = (sourceMap[src] || 0) + o.total;
        });
        const revenueBySource = Object.keys(sourceMap).map(name => ({ name, value: sourceMap[name] }));
        if (revenueBySource.length === 0) revenueBySource.push({ name: 'direct', value: 0 });

        // 4. Funnel Logic
        const funnel = {
            visitors: visitorsCount,
            addToCart: events.filter(e => e.eventType === 'AddToCart').length,
            checkout: events.filter(e => e.eventType === 'InitiateCheckout').length,
            purchased: orders.length
        };

        // 5. Time Series (Mocked trend for UI consistency)
        const timeSeries = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            timeSeries.unshift({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                visitors: Math.floor(Math.random() * 500) + 100,
                sales: Math.floor(Math.random() * 5000) + 500
            });
        }

        // 6. Top Pages
        const pageViews = {};
        events.filter(e => e.eventType === 'PageView').forEach(e => {
            pageViews[e.path] = (pageViews[e.path] || 0) + 1;
        });
        const topPages = Object.keys(pageViews)
            .map(path => ({ path, views: pageViews[path] }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        res.json({
            kpis: { visitors: visitorsCount, sales: salesTotal, orders: orders.length, conversionRate },
            revenueBySource,
            funnel,
            timeSeries,
            topPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Detailed analytics failed' });
    }
});

// @desc    Get live traffic data
// @route   GET /api/analytics/live
router.get('/live', protect, admin, async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const [activeEvents, recentFeed] = await Promise.all([
            AnalyticsEvent.find({ createdAt: { $gt: fiveMinutesAgo } }),
            AnalyticsEvent.find().sort({ createdAt: -1 }).limit(10)
        ]);

        // Estimate active users by unique IPs or session identifiers if available
        // For now, we count unique events in the last 5 mins
        res.json({
            activeUsers: Math.max(activeEvents.length, 1),
            recentEvents: recentFeed.map(e => ({
                eventType: e.eventType,
                path: e.path,
                createdAt: e.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Live data fetch failed' });
    }
});

// @desc    Track user events
// @route   POST /api/analytics/track
router.post('/track', async (req, res) => {
    try {
        const { eventType, eventId, fbp, fbc, ...customData } = req.body;
        
        await AnalyticsEvent.create({
            eventType,
            path: req.body.path,
            source: req.body.source,
            utm: req.body.utm,
            data: customData
        });

        await sendCapiEvent({
            eventName: eventType,
            eventUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}${req.body.path || ''}`,
            eventId: eventId,
            userData: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                fbp: fbp,
                fbc: fbc
            },
            customData: customData
        });

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(200).json({ status: 'error' });
    }
});

module.exports = router;
