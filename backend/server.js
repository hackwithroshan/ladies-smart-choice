
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Critical Check: Ensure MONGO_URI is present
if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
    process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection with improved error handling
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        // Don't exit here, let the app stay alive to serve 503 errors instead of crashing
    });

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date()
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/content', require('./routes/content'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/media', require('./routes/media'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/discounts', require('./routes/discounts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/catalog', require('./routes/feed')); 
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/app-data', require('./routes/appData'));

// Initialize Cron Jobs (Wrapped in try-catch to prevent startup crash)
try {
    require('./cronJobs');
} catch (cronError) {
    console.error('Failed to initialize Cron Jobs:', cronError.message);
}

// --- Frontend Static Files Serving ---
const distPath = path.resolve(__dirname, '..', 'dist');

if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    console.log('Serving frontend from:', distPath);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log('Standalone API Mode: No local /dist folder found.');
    app.get('/', (req, res) => {
        res.json({
            status: "Online",
            message: "Ayushree Ayurveda API is running.",
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            note: "Frontend build folder (/dist) not found on this server path."
        });
    });
}

// Global Error Handler for 500 Errors
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong on our end.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
