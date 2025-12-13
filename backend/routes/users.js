
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const orders = await Order.find({});

        // Calculate stats for each user
        const usersWithStats = users.map(user => {
            const userOrders = orders.filter(order => order.userId && order.userId.toString() === user._id.toString());
            const totalSpent = userOrders.reduce((acc, order) => acc + order.total, 0);
            const totalOrders = userOrders.length;
            
            // Basic segmentation logic
            let segment = 'New';
            if (totalOrders > 5 && totalSpent > 10000) segment = 'VIP';
            else if (totalSpent > 5000) segment = 'High-Value';
            else if (totalOrders > 1) segment = 'Returning';

            // Get contact info from the most recent order
            const recentOrder = userOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            return {
                id: user._id,
                name: user.name,
                email: user.email,
                joinDate: user.joinDate,
                role: user.role,
                avatarUrl: user.avatarUrl,
                totalOrders,
                totalSpent,
                segment,
                phone: recentOrder ? recentOrder.customerPhone : undefined,
                shippingAddress: recentOrder ? recentOrder.shippingAddress : undefined,
            };
        });

        res.json(usersWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});


// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.avatarUrl = req.body.avatarUrl; // Allow clearing the avatar

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

// @desc    Change current user's password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both current and new passwords.' });
    }

    const user = await User.findById(req.user.id);

    if (user && (await user.matchPassword(currentPassword))) {
        user.password = newPassword; // The pre-save hook will hash it
        await user.save();
        res.json({ message: 'Password updated successfully.' });
    } else {
        res.status(401).json({ message: 'Invalid current password.' });
    }
});


// @desc    Update user role by ID
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Admin: Reset User Password
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
router.put('/:id/reset-password', protect, admin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const user = await User.findById(req.params.id);
        if (user) {
            user.password = newPassword; // Pre-save hook will hash this
            await user.save();
            res.json({ message: `Password for ${user.name} has been reset successfully.` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
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
