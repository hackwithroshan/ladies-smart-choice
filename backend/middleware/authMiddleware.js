
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * STRICT PROTECTION
 * Returns 401 if token is missing or invalid.
 */
const protect = async (req, res, next) => {
    // Safety check: Is DB ready?
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database connection in progress. Please try again.' });
    }

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!token || token === 'null' || token === 'undefined') {
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) return res.status(401).json({ message: 'Account no longer exists.' });
            
            next();
        } catch (error) {
            console.error("Auth Protect Error:", error.message);
            res.status(401).json({ message: 'Authorization failed' });
        }
    } else {
        res.status(401).json({ message: 'No access token provided' });
    }
};

/**
 * OPTIONAL PROTECTION
 * Attempts to identify the user if a token exists, but proceeds anyway if not.
 * Useful for guest checkouts that might be logged in.
 */
const optionalProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (token && token !== 'null' && token !== 'undefined') {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                if (user) req.user = user;
            }
        } catch (error) {
            // Silently ignore errors for optional auth
        }
    }
    next();
};

/**
 * ADMIN CHECK
 * Requires req.user to be set by protect/optionalProtect first.
 */
const admin = (req, res, next) => {
    if (req.user && ['Super Admin', 'Manager', 'Editor', 'Staff'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
};

module.exports = { protect, optionalProtect, admin };
