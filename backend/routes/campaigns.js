
const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, async (req, res) => {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.json(campaigns);
});

router.post('/', protect, admin, async (req, res) => {
    const newCampaign = new Campaign(req.body);
    await newCampaign.save();
    res.status(201).json(newCampaign);
});

// Add PUT and DELETE as needed

module.exports = router;
