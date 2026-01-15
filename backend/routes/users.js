
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// @desc    Get all users with summarized statistics
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const orders = await Order.find({});

        const usersWithStats = users.map(user => {
            const userOrders = orders.filter(order => order.customerEmail === user.email || (order.userId && order.userId.toString() === user._id.toString()));
            const totalSpent = userOrders.reduce((acc, order) => acc + order.total, 0);
            const totalOrders = userOrders.length;

            // Sort to get latest order
            userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const lastOrderDate = userOrders.length > 0 ? userOrders[0].createdAt : null;

            // Prefer user's saved phone, otherwise fallback to phone from latest order
            const displayPhone = user.phone || (userOrders.length > 0 ? userOrders[0].customerPhone : 'N/A');

            let segment = 'Standard';
            if (totalOrders > 10 || totalSpent > 25000) segment = 'VIP';
            else if (totalSpent > 10000) segment = 'High-Value';
            else if (totalOrders > 0) segment = 'Active';

            return {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: displayPhone,
                joinDate: user.joinDate,
                role: user.role,
                avatarUrl: user.avatarUrl,
                totalOrders,
                totalSpent,
                lastOrderDate: lastOrderDate,
                segment
            };
        });

        res.json(usersWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get current user's profile
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
});

// @desc    Update current user's profile
router.put('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.avatarUrl = req.body.avatarUrl || user.avatarUrl;
        const updatedUser = await user.save();
        res.json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            joinDate: updatedUser.joinDate,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Admin: Delete user
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role === 'Super Admin') return res.status(403).json({ message: "Cannot delete a Super Admin." });
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
