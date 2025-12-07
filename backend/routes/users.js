
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

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

            return {
                id: user._id,
                name: user.name,
                email: user.email,
                joinDate: user.joinDate,
                role: user.role,
                avatarUrl: user.avatarUrl,
                totalOrders,
                totalSpent,
                segment
            };
        });

        res.json(usersWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update user role
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
