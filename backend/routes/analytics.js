
const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');
const { sendCapiEvent } = require('../utils/facebookCapiService');

// @desc    Track an event (Public)
router.post('/track', async (req, res) => {
    try {
        const { eventType, path, domain, eventId, data, source } = req.body;
        
        // 1. Internal Logging
        await AnalyticsEvent.create({
            eventType,
            path,
            domain,
            eventId,
            source: source || 'direct',
            data: data || {}
        });

        // 2. Meta CAPI Bridge (Async)
        sendCapiEvent({
            eventName: eventType,
            eventUrl: `https://${domain}${path}`,
            eventId: eventId,
            userData: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                email: data?.email
            },
            customData: data
        });

        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(200).json({ status: 'ignored' });
    }
});

// @desc    Get Comprehensive Summary
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);

        // 1. KPI Aggregation
        const orders = await Order.find({ status: { $ne: 'Cancelled' } });
        const events = await AnalyticsEvent.find({});

        const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
        const totalOrders = orders.length;
        const totalVisitors = events.filter(e => e.eventType === 'PageView').length;
        
        const summary = {
            kpis: {
                sales: totalRevenue,
                visitors: totalVisitors,
                orders: totalOrders,
                conversionRate: totalVisitors > 0 ? ((totalOrders / totalVisitors) * 100).toFixed(2) : 0
            },
            funnel: {
                visitors: totalVisitors,
                addToCart: events.filter(e => e.eventType === 'AddToCart').length,
                checkout: events.filter(e => e.eventType === 'InitiateCheckout').length,
                purchased: totalOrders
            },
            timeSeries: await Order.aggregate([
                { $match: { status: { $ne: 'Cancelled' } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$total" },
                    orders: { $sum: 1 }
                }},
                { $sort: { _id: 1 } },
                { $limit: 30 }
            ]),
            topPages: await AnalyticsEvent.aggregate([
                { $match: { eventType: 'PageView' } },
                { $group: { _id: "$path", views: { $sum: 1 } } },
                { $sort: { views: -1 } },
                { $limit: 5 }
            ]).then(res => res.map(r => ({ path: r._id, views: r.views })))
        };

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get Live Pulse
router.get('/live', protect, admin, async (req, res) => {
    try {
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const activeUsers = await AnalyticsEvent.distinct('eventId', { 
            createdAt: { $gte: tenMinsAgo } 
        });

        const recentEvents = await AnalyticsEvent.find({})
            .sort({ createdAt: -1 })
            .limit(15);

        res.json({
            activeUsers: activeUsers.length,
            recentEvents
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
