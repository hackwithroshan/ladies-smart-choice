
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/dashboard-summary', protect, admin, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Basic Stats
        const [orders, customers, logs] = await Promise.all([
            Order.find({ status: { $ne: 'Cancelled' } }),
            User.find({ role: 'User' }),
            ActivityLog.find().sort({ createdAt: -1 }).limit(10)
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const thisMonthRevenue = orders
            .filter(o => o.date >= startOfMonth)
            .reduce((sum, o) => sum + o.total, 0);

        res.json({
            kpis: {
                totalRevenue: { value: totalRevenue, growth: 12.5 },
                totalOrders: { value: orders.length, growth: 8.2 },
                newCustomers: { value: customers.length, growth: 4.1 },
                avgOrderValue: { value: orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : 0, growth: 2.3 }
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
        res.status(500).json({ message: 'Analytics failed' });
    }
});

module.exports = router;
