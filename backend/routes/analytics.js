const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { protect, admin } = require('../middleware/authMiddleware');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// Utility: Get Date Range
const getRange = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    return { start, end };
};

// @desc    Get dashboard summary (Existing + KPIs)
router.get('/summary', protect, admin, async (req, res) => {
    try {
        const { start, end } = getRange(req.query.startDate, req.query.endDate);

        // 1. Fetch Orders
        const orders = await Order.find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } });

        // 2. Fetch Sessions (Unique SessionIds)
        // We'll use aggregation for speed
        const sessionStats = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: "$sessionId" } }, // Just count unique sessions
            { $count: "count" }
        ]);
        const visitorsCount = sessionStats[0]?.count || 0;

        // 3. Time Series Data (Daily)
        const dailyData = {};

        // Process Orders
        orders.forEach(order => {
            const date = new Date(order.date).toISOString().split('T')[0];
            if (!dailyData[date]) dailyData[date] = { date, sales: 0, orders: 0, visitors: 0 };
            dailyData[date].sales += order.total;
            dailyData[date].orders += 1;
        });

        // Process Sessions (Daily Visitors)
        const sessionDaily = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: {
                        session: "$sessionId",
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    visitors: { $sum: 1 } // Count unique sessions per day
                }
            }
        ]);

        sessionDaily.forEach(day => {
            if (!dailyData[day._id]) dailyData[day._id] = { date: day._id, sales: 0, orders: 0, visitors: 0 };
            dailyData[day._id].visitors = day.visitors;
        });

        const timeSeries = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

        // 4. Simple KPIs for top cards
        const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

        // 5. Funnel Data
        const eventCounts = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, eventType: { $in: ['AddToCart', 'InitiateCheckout'] } } },
            { $group: { _id: "$eventType", count: { $sum: 1 } } }
        ]);
        const addToCartCount = eventCounts.find(e => e._id === 'AddToCart')?.count || 0;
        const checkoutCount = eventCounts.find(e => e._id === 'InitiateCheckout')?.count || 0;

        // 6. Top Pages
        const topPages = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, eventType: 'PageView' } },
            { $group: { _id: "$path", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { path: "$_id", views: "$count", _id: 0 } }
        ]);

        res.json({
            kpis: {
                visitors: visitorsCount,
                sales: totalRevenue,
                orders: orders.length,
                conversionRate: visitorsCount > 0 ? ((orders.length / visitorsCount) * 100).toFixed(1) : 0
            },
            timeSeries, // Restored for Dashboard Chart
            funnel: {
                visitors: visitorsCount,
                addToCart: addToCartCount,
                checkout: checkoutCount,
                purchased: orders.length
            },
            topPages,
            revenueBySource: [] // Placeholder to satisfy frontend interface
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Summary failed' });
    }
});

// @desc    Get Detailed Analytics (The 6 Cards)
router.get('/details', protect, admin, async (req, res) => {
    try {
        const { start, end } = getRange(req.query.startDate, req.query.endDate);

        // Common Match Stage
        const matchStage = { $match: { createdAt: { $gte: start, $lte: end } } };

        // 1. Sessions by Device Type
        const deviceStats = await AnalyticsEvent.aggregate([
            matchStage,
            { $group: { _id: "$sessionId", device: { $first: "$device.deviceType" } } },
            {
                $group: {
                    _id: { $ifNull: ["$device", "Desktop"] }, // Fallback for old/missing data
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Sessions by Location
        const locationStats = await AnalyticsEvent.aggregate([
            matchStage,
            {
                $group: {
                    _id: "$sessionId",
                    country: { $first: "$location.country" },
                    state: { $first: "$location.state" },
                    city: { $first: "$location.city" },
                    area: { $first: "$location.area" }
                }
            },
            {
                $group: {
                    _id: { country: "$country", state: "$state", city: "$city", area: "$area" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // 3. Sessions by Landing Page
        const landingPageStats = await AnalyticsEvent.aggregate([
            matchStage,
            { $sort: { createdAt: 1 } },
            { $group: { _id: "$sessionId", landingPage: { $first: "$path" } } },
            { $group: { _id: "$landingPage", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // 4. Sessions by Referrer
        const referrerStats = await AnalyticsEvent.aggregate([
            matchStage,
            { $group: { _id: "$sessionId", referrer: { $first: "$referrerUrl" } } },
            {
                $addFields: {
                    domain: { $ifNull: ["$referrer", "Direct / None"] }
                }
            },
            { $group: { _id: "$domain", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // 5. Sessions by Social Referrer
        const socialKeywords = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 't.co', 'lnkd.in'];
        const socialStats = await AnalyticsEvent.aggregate([
            matchStage,
            { $group: { _id: "$sessionId", referrer: { $first: "$referrerUrl" }, utmSource: { $first: "$utm.source" } } },
            {
                $addFields: {
                    socialSource: {
                        $cond: {
                            if: {
                                $or: [
                                    { $in: ["$utmSource", socialKeywords] },
                                    { $regexMatch: { input: "$referrer", regex: /facebook|instagram|twitter|linkedin|youtube|pinterest/i } }
                                ]
                            },
                            then: { $ifNull: ["$utmSource", "Social (Referrer)"] },
                            else: null
                        }
                    }
                }
            },
            { $match: { socialSource: { $ne: null } } },
            { $group: { _id: "$socialSource", count: { $sum: 1 } } }
        ]);

        // 6. Total Sales by Social Referrer
        const socialSales = await Order.aggregate([
            { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
            {
                $project: {
                    total: 1,
                    source: { $ifNull: ["$utmSource", "$referrer", "Direct"] }
                }
            },
            {
                $addFields: {
                    isSocial: { $regexMatch: { input: "$source", regex: /facebook|instagram|twitter|linkedin|youtube|pinterest/i } }
                }
            },
            { $match: { isSocial: true } },
            { $group: { _id: "$source", totalSales: { $sum: "$total" } } }
        ]);

        res.json({
            device: deviceStats,
            location: locationStats,
            landingPage: landingPageStats,
            referrer: referrerStats,
            socialSessions: socialStats,
            socialSales: socialSales
        });

    } catch (error) {
        console.error("Analytics Details Error:", error);
        res.status(500).json({ message: 'Failed to fetch analytics details' });
    }
});

// @desc    Get Live Analytics (Active Users, Pages, Feed)
router.get('/live', protect, admin, async (req, res) => {
    try {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

        // 1. Active Users
        const activeUsers = (await AnalyticsEvent.distinct('sessionId', {
            createdAt: { $gte: thirtyMinAgo }
        })).length;

        // 2. Active Pages
        const activePages = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: thirtyMinAgo }, eventType: 'PageView' } },
            { $group: { _id: "$path", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { path: "$_id", count: 1, _id: 0 } }
        ]);

        // 3. Recent Activity
        const recentEvents = await AnalyticsEvent.find({ createdAt: { $gte: thirtyMinAgo } })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('eventType path createdAt location device');

        res.json({
            activeUsers,
            activePages,
            recentEvents
        });

    } catch (e) {
        console.error("Live Analytics Error:", e);
        res.status(500).json({ message: 'Live analytics failed' });
    }
});

// @desc    Track Event
router.post('/track', async (req, res) => {
    try {
        const { eventType, path, sessionId, referrer, utm } = req.body;
        const fetch = require('node-fetch');

        // 1. Capture Client IP (Robust Real IP detection)
        // Check Cloudflare, Nginx, and standard headers
        let ip = req.headers['cf-connecting-ip'] ||
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress || '';

        if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
        if (ip && ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');

        console.log('📍 Tracking Real User IP:', ip); // Verify IP in Terminal


        // 2. Identify Localhost/Private IP
        const isLocal = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');

        let location = { country: 'Unknown', state: 'Unknown', city: 'Unknown', area: '', ip };

        // Helper to fetch from ip-api.com (HTTP, fast, reliable)
        const fetchIpApi = async (queryIp) => {
            try {
                // Request specific fields: District is the key for "Area"
                const fields = 'status,country,regionName,city,district,query';
                // If Localhost, query without IP to get Server's Public IP (Dev's Real Location)
                const url = queryIp ? `http://ip-api.com/json/${queryIp}?fields=${fields}` : `http://ip-api.com/json/?fields=${fields}`;

                const response = await fetch(url, { timeout: 4000 });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        // Strict Filter: Only allow text-based Areas (No Zip Codes)
                        let area = data.district || '';
                        if (/^\d+$/.test(area) || area === data.city) area = ''; // Remove zips and duplicates

                        return {
                            country: data.country,
                            state: data.regionName,
                            city: data.city,
                            area: area,
                            ip: data.query
                        };
                    }
                }
            } catch (e) { /* ignore */ }
            return null;
        };

        // 3. Execute Resolution
        let resolvedLoc = null;
        if (isLocal) {
            resolvedLoc = await fetchIpApi(null);
        } else {
            resolvedLoc = await fetchIpApi(ip);
        }

        // 4. Apply Properties
        if (resolvedLoc) {
            location = { ...location, ...resolvedLoc };
        }

        // 5. User Agent Parsing
        const ua = UAParser(req.headers['user-agent']);
        const device = {
            deviceType: ua.device.type || 'desktop',
            browser: ua.browser.name,
            os: ua.os.name
        };

        // 6. Persist
        await AnalyticsEvent.create({
            eventType: eventType || 'PageView',
            sessionId,
            path,
            location,
            device,
            referrerUrl: referrer,
            utm, // { source, medium, campaign }
        });

        res.status(200).json({ ok: true });
    } catch (e) {
        console.error("Tracking Error:", e);
        res.status(200).json({ ok: false }); // Fail silently to client
    }
});

module.exports = router;
