const express = require('express');
const router = express.Router();
const Automation = require('../models/Automation');
const EmailTemplate = require('../models/EmailTemplate');
const AutomationLog = require('../models/AutomationLog');

// Get all automations with stats
router.get('/', async (req, res) => {
    try {
        // Ensure all types exist
        const types = [
            'ABANDONED_CHECKOUT',
            'ORDER_CONFIRMATION',
            'INVOICE',
            'ORDER_SHIPPED',
            'WELCOME_USER',
            'FORGOT_PASSWORD'
        ];

        for (const type of types) {
            const exists = await Automation.findOne({ triggerType: type });
            if (!exists) {
                const newTemplate = await EmailTemplate.create({
                    name: `Default ${type}`,
                    type: type,
                    subject: 'Notification',
                    body: '<p>Edit this template</p>',
                    placeholders: []
                });
                await Automation.create({
                    name: type.replace(/_/g, ' '),
                    triggerType: type,
                    isActive: false,
                    templateId: newTemplate._id
                });
            }
        }

        const automations = await Automation.find().populate('templateId');

        // Aggregate Real Stats
        const results = await Promise.all(automations.map(async (auto) => {
            const sentCount = await AutomationLog.countDocuments({ automationId: auto._id, status: 'SENT' });

            // For now, let's assume "Sessions" = Sent emails (reach) or clicks if we tracked them.
            // But prompt says "Reach, Sessions, Orders". Reach = sent. Sessions = clicked link (if we tracked).
            // Without click tracking (need a redirect service), I'll set Sessions = Reach or Sent.
            // Or if I can't track sessions, maybe I can just count logs that have 'opened' status if I implement open tracking?
            // Let's settle for Reach = Sent. Sessions = Sent (proxy, since we don't have click tracking yet).
            // Orders = Converted logs.

            const ordersCount = await AutomationLog.countDocuments({ automationId: auto._id, converted: true });

            const salesAggregation = await AutomationLog.aggregate([
                { $match: { automationId: auto._id, converted: true } },
                { $group: { _id: null, total: { $sum: '$conversionValue' } } }
            ]);
            const sales = salesAggregation[0]?.total || 0;

            const conversionRate = sentCount > 0 ? ((ordersCount / sentCount) * 100).toFixed(2) : 0;

            return {
                ...auto.toObject(),
                stats: {
                    reach: sentCount,
                    sessions: sentCount, // Proxy for now
                    orders: ordersCount,
                    conversionRate: parseFloat(conversionRate),
                    sales: sales
                }
            };
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Toggle Status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const automation = await Automation.findById(req.params.id);
        if (!automation) return res.status(404).json({ message: 'Automation not found' });

        automation.isActive = !automation.isActive;
        await automation.save();
        res.json(automation);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Templates
router.get('/templates', async (req, res) => {
    try {
        const templates = await EmailTemplate.find();
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Template
router.put('/templates/:id', async (req, res) => {
    try {
        const { subject, body } = req.body;
        const template = await EmailTemplate.findByIdAndUpdate(
            req.params.id,
            { subject, body },
            { new: true }
        );
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
