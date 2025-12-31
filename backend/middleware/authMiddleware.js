
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // 1. Strict validation for garbage/empty strings from localstorage
            if (!token || token === 'null' || token === 'undefined' || token === '') {
                return res.status(401).json({ message: 'Session expired or missing. Please login.' });
            }

            // 2. Validate JWT structure (must have header, payload, and signature separated by dots)
            if (token.split('.').length !== 3) {
                console.error("Auth Error: Malformed token structure received.");
                return res.status(401).json({ message: 'Invalid security token format' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) return res.status(401).json({ message: 'User account not found' });
            
            next();
        } catch (error) {
            console.error("Auth Protect Error:", error.message);
            res.status(401).json({ message: 'Authorization failed, session invalid' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token found' });
    }
};

/**
 * Optional protection for Guest Checkout.
 * Only resolves req.user if a VALID token is provided.
 */
const optionalProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Only attempt verification if the token looks like a valid JWT
            if (token && token !== 'null' && token !== 'undefined' && token.split('.').length === 3) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
            }
        } catch (error) {
            // Silently fail for optional auth; user remains undefined (Guest mode)
            console.log("Optional Auth: Token invalid, proceeding as Guest.");
        }
    }
    next();
};

const admin = (req, res, next) => {
    if (req.user && ['Super Admin', 'Manager', 'Editor', 'Staff'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
};

module.exports = { protect, optionalProtect, admin };
