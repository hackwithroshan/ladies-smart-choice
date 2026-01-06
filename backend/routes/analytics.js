
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { protect, admin } = require('../middleware/authMiddleware');
const { sendCapiEvent } = require('../utils/facebookCapiService');

// @desc    Get Detailed Analytics Summary for "Advanced Analytics" view
// @route   GET /api/analytics/summary
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        // 1. Fetch Core Data
        const [orders, events] = await Promise.all([
            Order.find({ createdAt: { $gte: start, $lte: end } }),
            AnalyticsEvent.find({ createdAt: { $gte: start, $lte: end } })
        ]);

        // 2. Calculate KPIs
        const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
        const uniqueVisitors = new Set(events.map(e => e.data?.ip || e._id)).size || 1; // Fallback to 1 to avoid div zero
        
        const kpis = {
            visitors: uniqueVisitors,
            sales: Math.round(totalSales),
            orders: orders.length,
            conversionRate: ((orders.length / uniqueVisitors) * 100).toFixed(2)
        };

        // 3. Funnel Aggregation
        const funnel = {
            visitors: uniqueVisitors,
            viewContent: events.filter(e => e.eventType === 'ViewContent').length,
            addToCart: events.filter(e => e.eventType === 'AddToCart').length,
            checkout: events.filter(e => e.eventType === 'InitiateCheckout').length,
            purchased: orders.length
        };

        // 4. Time Series Data (Daily Breakdown)
        const timeSeriesMap = {};
        // Initialize last 7 days at least
        for(let i=0; i<30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            timeSeriesMap[dateStr] = { date: dateStr, visitors: 0, sales: 0 };
        }

        events.forEach(e => {
            const d = e.createdAt.toISOString().split('T')[0];
            if(timeSeriesMap[d]) timeSeriesMap[d].visitors++;
        });
        orders.forEach(o => {
            const d = o.createdAt.toISOString().split('T')[0];
            if(timeSeriesMap[d]) timeSeriesMap[d].sales += o.total;
        });

        const timeSeries = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date));

        // 5. Source Distribution
        const sourcesCount = {};
        events.forEach(e => {
            const src = e.source || 'direct';
            sourcesCount[src] = (sourcesCount[src] || 0) + 1;
        });
        const revenueBySource = Object.entries(sourcesCount).map(([name, value]) => ({ name, value }));

        // 6. Top Pages
        const pathCount = {};
        events.forEach(e => {
            if(e.path) pathCount[e.path] = (pathCount[e.path] || 0) + 1;
        });
        const topPages = Object.entries(pathCount)
            .map(([path, views]) => ({ path, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        res.json({
            kpis,
            revenueBySource,
            funnel,
            timeSeries,
            topPages
        });

    } catch (error) {
        console.error("Analytics Summary Error:", error);
        res.status(500).json({ message: 'Analytics aggregation failed' });
    }
});

router.get('/dashboard-summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        const [orders, customers, logs, recentOrders] = await Promise.all([
            Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
            User.find({ role: 'User', joinDate: { $gte: start, $lte: end } }),
            ActivityLog.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(10),
            Order.find({}).sort({ date: -1 }).limit(6)
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
            })),
            recentOrders: recentOrders.map(o => ({
                customerName: o.customerName,
                customerEmail: o.customerEmail,
                status: o.status,
                date: o.date,
                total: o.total,
                checkoutType: o.checkoutType
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Dashboard summary failed' });
    }
});

router.get('/live', protect, admin, async (req, res) => {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const liveEvents = await AnalyticsEvent.find({ createdAt: { $gt: tenMinutesAgo } }).sort({ createdAt: -1 });

        const activePages = {};
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

router.post('/track', async (req, res) => {
    try {
        const { eventType, path, source, utm, eventId, fbp, fbc, data: customData } = req.body;
        
        // 1. Log to Internal DB
        await AnalyticsEvent.create({ eventType, path, source, utm, data: { ...customData, ip: req.ip } });

        // 2. Trigger Meta CAPI (Dual Tracking)
        const protocol = req.secure ? 'https' : 'http';
        const fullUrl = `${protocol}://${req.get('host')}${path}`;
        
        sendCapiEvent({
            eventName: eventType,
            eventUrl: fullUrl,
            eventId: eventId,
            userData: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                fbp,
                fbc
            },
            customData
        });

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(200).json({ status: 'error' });
    }
});

module.exports = router;
