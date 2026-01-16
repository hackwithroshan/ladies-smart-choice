const express = require('express');
const router = express.Router();
const { sendCapiEvent } = require('../utils/facebookCapiService');
const { sendGoogleEvent } = require('../utils/googleAdsService');

// Track Event (Called from Frontend)
router.post('/track', async (req, res) => {
    try {
        const { eventName, eventId, eventUrl, userData, customData } = req.body;

        // Parallel Execution
        Promise.allSettled([
            sendCapiEvent({
                eventName,
                eventUrl: eventUrl || 'backend',
                eventId,
                userData: userData || {},
                customData: customData || {}
            }),
            sendGoogleEvent({
                eventName,
                eventId,
                userData: userData || {},
                value: customData?.value,
                currency: customData?.currency,
                items: customData?.contents // Mapping contents to items
            })
        ]);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Tracking Error:", err);
        // Don't block the client
        res.status(200).json({ success: false });
    }
});

module.exports = router;
