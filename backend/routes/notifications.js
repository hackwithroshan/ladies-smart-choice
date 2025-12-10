
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all notifications for the current admin user
// @route   GET /api/notifications
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to recent 20
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Mark all notifications as read for the current admin user
// @route   POST /api/notifications/mark-read
// @access  Private/Admin
router.post('/mark-read', protect, admin, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
