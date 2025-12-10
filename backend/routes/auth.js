
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetOTP, sendWelcomeEmail } = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        const user = await User.create({ name, email, password });
        if (user) {
            // --- SEND WELCOME EMAIL (Fire and forget) ---
            try {
                await sendWelcomeEmail(user.email, user.name);
            } catch (emailError) {
                console.error(`Failed to send welcome email to ${user.email}:`, emailError);
            }
            // --- END ---

            res.status(201).json({
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    joinDate: user.joinDate,
                }
            });
        }
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    joinDate: user.joinDate,
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// @desc    Forgot Password - Generate & send OTP via email
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Security measure: Don't reveal if a user exists or not.
            // Send a success-like response even if the user is not found.
            return res.status(200).json({ message: `If an account with ${email} exists, an OTP has been sent.` });
        }

        // Generate a 6-digit OTP
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

        await user.save({ validateBeforeSave: false });

        try {
            // --- SEND REAL EMAIL ---
            await sendPasswordResetOTP(user.email, resetToken);
            res.status(200).json({ message: `An OTP has been sent to ${user.email}.` });

        } catch (emailError) {
            console.error("Email Sending Error:", emailError);
            // If email fails, we should not leave the reset token in the DB.
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false }); // Rollback
            
            res.status(500).json({ message: 'Failed to send the password reset email. Please try again later.' });
        }

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: 'Server error while processing the request.' });
    }
});

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ 
            email, 
            passwordResetToken: otp,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Server error while resetting password.' });
    }
});


module.exports = router;
