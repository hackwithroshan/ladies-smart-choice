
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { sendCapiEvent } = require('../utils/facebookCapiService');

// @desc    Send a test event to Meta CAPI
// @route   POST /api/integrations/facebook/test-event
// @access  Private/Admin
router.post('/facebook/test-event', protect, admin, async (req, res) => {
    const { testEventCode } = req.body;

    if (!testEventCode) {
        return res.status(400).json({ message: 'Test Event Code is required.' });
    }

    try {
        await sendCapiEvent({
            eventName: 'TestEvent',
            eventUrl: `${process.env.FRONTEND_URL}/admin`,
            eventId: `test_${Date.now()}`,
            userData: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                email: req.user.email, // Use admin's email for test
            },
            testEventCode: testEventCode,
        });

        res.status(200).json({ message: 'Test event sent successfully! Check your Meta Events Manager.' });

    } catch (error) {
        console.error('Failed to send test event:', error);
        res.status(500).json({ message: 'Server error while sending test event.' });
    }
});

module.exports = router;