
const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { sendCapiEvent } = require('../utils/facebookCapiService');

router.post('/track', async (req, res) => {
    try {
        const { eventType, path, domain, eventId, fbp, fbc, userAgent, sourceUrl, data } = req.body;
        
        // 1. Internal Analytics Logging
        await AnalyticsEvent.create({
            eventType,
            path,
            source: domain, // Log the dynamic domain
            data: { ...data, ip: req.ip }
        });

        // 2. Instant Meta CAPI Bridge
        const fullUrl = sourceUrl || `https://${domain}${path}`;
        
        sendCapiEvent({
            eventName: eventType,
            eventUrl: fullUrl,
            eventId: eventId,
            userData: {
                ip: req.ip,
                userAgent: userAgent || req.headers['user-agent'],
                fbp,
                fbc,
                email: data?.email,
                phone: data?.phone 
            },
            customData: data
        });

        res.status(200).json({ status: 'sent' });
    } catch (error) {
        res.status(200).json({ status: 'ignored' });
    }
});

module.exports = router;
