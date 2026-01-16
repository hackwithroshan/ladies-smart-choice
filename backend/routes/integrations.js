const express = require('express');
const router = express.Router();
const { sendCapiEvent } = require('../utils/facebookCapiService');
const SiteSettings = require('../models/SiteSettings');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/test-event', protect, admin, async (req, res) => {
    try {
        const { testEventCode } = req.body;

        if (!testEventCode) {
            return res.status(400).json({ message: 'Test Event Code is required.' });
        }

        const settings = await SiteSettings.findOne();
        if (!settings || !settings.metaAccessToken) {
            return res.status(400).json({ message: 'Apps not configured properly.' });
        }

        await sendCapiEvent({
            eventName: 'PageView',
            eventUrl: 'https://example.com/test-event',
            eventId: `test_${Date.now()}`,
            userData: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                email: 'test@example.com' // Dummy data for test
            },
            testEventCode: testEventCode
        });

        res.json({ success: true, message: 'Test event sent to Meta.' });
    } catch (error) {
        console.error("Test Event Error:", error);
        res.status(500).json({ message: 'Failed to send test event.' });
    }
});

module.exports = router;