
const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');
const SiteSettings = require('../models/SiteSettings');
const { protect, admin } = require('../middleware/authMiddleware');
const { sendCapiEvent } = require('../utils/facebookCapiService');

// Endpoint to track events from the frontend
router.post('/track', async (req, res) => {
    try {
        const { eventType, eventId, data, path } = req.body;

        // --- Check if tracking is enabled for this event ---
        const settings = await SiteSettings.findOne();
        const eventMap = {
            PageView: 'trackPageView',
            ViewContent: 'trackViewContent',
            AddToCart: 'trackAddToCart',
            InitiateCheckout: 'trackInitiateCheckout',
            Purchase: 'trackPurchase',
        };
        const settingKey = eventMap[eventType];
        
        // If settings exist and the specific tracking toggle is explicitly set to false, skip tracking.
        if (settings && settingKey && settings[settingKey] === false) {
            console.log(`Tracking SKIPPED for event '${eventType}' as it is disabled in settings.`);
            return res.status(200).json({ message: `Tracking disabled for ${eventType}.` });
        }
        
        const event = new AnalyticsEvent(req.body);
        await event.save();
        
        // --- Trigger Meta CAPI Event ---
        if (eventType && eventId) { // Required for CAPI
             await sendCapiEvent({
                eventName: eventType,
                eventUrl: `${process.env.FRONTEND_URL}${path}`,
                eventId: eventId,
                userData: {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    fbp: req.body.fbp, // Forwarded from client
                    fbc: req.body.fbc, // Forwarded from client
                    // PII is best handled on purchase/auth events, not generic tracking
                },
                customData: data,
            });
        }
        
        res.status(201).send();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Analytics track error:", error);
        }
        res.status(400).send();
    }
});

// Endpoint for the admin analytics dashboard summary
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate query parameters are required.' });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // --- 1. Main KPIs and Traffic Source Stats ---
        const aggregationResult = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $facet: {
                    bySource: [
                        { $group: {
                            _id: '$source',
                            visitors: { $sum: { $cond: [{ $eq: ['$eventType', 'PageView'] }, 1, 0] } },
                            purchases: { $sum: { $cond: [{ $eq: ['$eventType', 'Purchase'] }, 1, 0] } },
                            revenue: { $sum: { $cond: [{ $eq: ['$eventType', 'Purchase'] }, { $ifNull: ['$data.value', 0] }, 0] } }
                        }}
                    ],
                    totals: [
                         { $group: {
                            _id: null,
                            totalVisitors: { $sum: { $cond: [{ $eq: ['$eventType', 'PageView'] }, 1, 0] } },
                            totalPurchases: { $sum: { $cond: [{ $eq: ['$eventType', 'Purchase'] }, 1, 0] } },
                            totalRevenue: { $sum: { $cond: [{ $eq: ['$eventType', 'Purchase'] }, { $ifNull: ['$data.value', 0] }, 0] } }
                        }}
                    ]
                }
            }
        ]);

        // FIX: Handle case where no analytics events exist to prevent crash
        const sourceStats = aggregationResult.length > 0 ? aggregationResult[0] : { bySource: [], totals: [] };
        
        const totals = sourceStats.totals[0] || { totalVisitors: 0, totalPurchases: 0, totalRevenue: 0 };
        const conversionRate = totals.totalVisitors > 0 ? ((totals.totalPurchases / totals.totalVisitors) * 100).toFixed(2) : 0;
        
        const revenueBySource = sourceStats.bySource.map(s => ({ name: s._id || 'unknown', value: s.revenue }));

        // --- 2. Conversion Funnel ---
        const funnelStats = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, eventType: { $in: ['PageView', 'AddToCart', 'InitiateCheckout', 'Purchase'] } } },
            { $group: { _id: '$eventType', count: { $sum: 1 } } }
        ]);

        const funnel = {
            visitors: funnelStats.find(s => s._id === 'PageView')?.count || 0,
            addToCart: funnelStats.find(s => s._id === 'AddToCart')?.count || 0,
            checkout: funnelStats.find(s => s._id === 'InitiateCheckout')?.count || 0,
            purchased: funnelStats.find(s => s._id === 'Purchase')?.count || 0,
        };
        
        // --- 3. Visitors and Sales Over Time ---
        const timeSeries = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, eventType: { $in: ['PageView', 'Purchase'] } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    visitors: { $sum: { $cond: [{ $eq: ['$eventType', 'PageView'] }, 1, 0] } },
                    sales: { $sum: { $cond: [{ $eq: ['$eventType', 'Purchase'] }, { $ifNull: ['$data.value', 0] }, 0] } }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', visitors: 1, sales: 1 } }
        ]);

        // --- 4. Top Landing Pages ---
        const topPages = await AnalyticsEvent.aggregate([
            { $match: { eventType: 'PageView', createdAt: { $gte: start, $lte: end }, path: { $ne: null } } },
            { $group: { _id: '$path', views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, path: '$_id', views: 1 } }
        ]);

        res.json({
            kpis: {
                visitors: totals.totalVisitors,
                sales: totals.totalRevenue,
                orders: totals.totalPurchases,
                conversionRate: parseFloat(conversionRate),
            },
            revenueBySource,
            funnel,
            timeSeries,
            topPages
        });

    } catch (error) {
        console.error("Analytics summary error:", error);
        res.status(500).json({ message: "Server error while fetching analytics." });
    }
});

// NEW endpoint for live analytics
router.get('/live', protect, admin, async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const activeUsers = await AnalyticsEvent.distinct('data.sessionId', {
            eventType: 'pageview',
            createdAt: { $gte: fiveMinutesAgo }
        });
        
        const recentEvents = await AnalyticsEvent.find({ createdAt: { $gte: fiveMinutesAgo } })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('eventType path data.items.name createdAt');

        res.json({
            activeUsers: activeUsers.length,
            recentEvents
        });

    } catch (error) {
        console.error("Live analytics error:", error);
        res.status(500).json({ message: "Server error fetching live data." });
    }
});

// NEW endpoint for recent events log
router.get('/recent-events', protect, admin, async (req, res) => {
    try {
        const recentEvents = await AnalyticsEvent.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .select('eventType source path createdAt');

        res.json(recentEvents);

    } catch (error) {
        console.error("Recent events fetch error:", error);
        res.status(500).json({ message: "Server error fetching recent events." });
    }
});


module.exports = router;
