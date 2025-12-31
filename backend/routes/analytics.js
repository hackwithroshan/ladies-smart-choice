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
// @route   GET /api/analytics/dashboard-summary
router.get('/dashboard-summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        const [orders, customers, logs, topProducts] = await Promise.all([
            Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
            User.find({ role: 'User', joinDate: { $gte: start, $lte: end } }),
            ActivityLog.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(10),
            Order.aggregate([
                { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
                { $unwind: "$items" },
                { $group: { _id: "$items.productId", name: { $first: "$items.name" }, totalQty: { $sum: "$items.quantity" }, totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
                { $sort: { totalQty: -1 } },
                { $limit: 5 }
            ])
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

        res.json({
            kpis: {
                totalRevenue: { value: totalRevenue, growth: 12.5 },
                totalOrders: { value: orders.length, growth: 8.2 },
                newCustomers: { value: customers.length, growth: 4.1 },
                avgOrderValue: { value: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0, growth: 2.3 }
            },
            topProducts,
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
// @route   GET /api/analytics/summary
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const [orders, events, topCoupons] = await Promise.all([
            Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
            AnalyticsEvent.find({ createdAt: { $gte: start, $lte: end } }),
            Discount.find({}).sort({ usageCount: -1 }).limit(5)
        ]);

        const visitorsCount = events.filter(e => e.eventType === 'PageView').length || 1;
        const salesTotal = orders.reduce((sum, o) => sum + o.total, 0);
        const conversionRate = ((orders.length / visitorsCount) * 100).toFixed(2);

        const funnel = {
            visitors: visitorsCount,
            addToCart: events.filter(e => e.eventType === 'AddToCart').length,
            checkout: events.filter(e => e.eventType === 'InitiateCheckout').length,
            purchased: orders.length
        };

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

        res.json({
            kpis: { visitors: visitorsCount, sales: salesTotal, orders: orders.length, conversionRate },
            funnel,
            timeSeries,
            topCoupons: topCoupons.map(c => ({ code: c.code, usage: c.usageCount })),
            revenueBySource: [{ name: 'organic', value: salesTotal * 0.6 }, { name: 'meta', value: salesTotal * 0.3 }, { name: 'google', value: salesTotal * 0.1 }]
        });
    } catch (error) {
        res.status(500).json({ message: 'Detailed analytics failed' });
    }
});

// @desc    Get live traffic data
router.get('/live', protect, admin, async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeEvents = await AnalyticsEvent.find({ createdAt: { $gt: fiveMinutesAgo } });
        res.json({ activeUsers: Math.max(activeEvents.length, 1), recentEvents: activeEvents.slice(0, 5) });
    } catch (error) {
        res.status(500).json({ message: 'Live data fetch failed' });
    }
});

// @desc    Track user events
router.post('/track', async (req, res) => {
    try {
        const { eventType, path, source, utm } = req.body;
        await AnalyticsEvent.create({ eventType, path, source, utm, data: req.body.data });
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(200).json({ status: 'error' });
    }
});

module.exports = router;