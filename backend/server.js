
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Security Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'https://ladiessmartchoice.com',
    'https://dashboard.ladiessmartchoice.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Access Denied for this origin.'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Robust Connection Logic
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error('❌ FATAL ERROR: process.env.MONGO_URI is missing!');
        process.exit(1);
    }

    try {
        console.log('⏳ Attempting to connect to MongoDB...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 15000,
        });
        console.log('✅ DATABASE CONNECTED: Connection to MongoDB Atlas Cluster established.');
    } catch (err) {
        console.error('❌ DATABASE CONNECTION FAILED!');
        console.error('---------------------------------------------------------');
        console.error('Error Details:', err.message);
        console.error('---------------------------------------------------------');

        if (err.message.includes('Could not connect to any servers')) {
            console.error('PRO TIP: This is usually an IP Whitelist issue.');
            console.error('1. Go to MongoDB Atlas -> Network Access.');
            console.error('2. Add "0.0.0.0/0" to allow access from everywhere for testing.');
            console.error('3. Check if your MONGO_URI in .env is exactly correct.');
        }

        process.exit(1);
    }
};

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
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/app-data', require('./routes/appData'));

// Registered missing modules required for Admin Dashboard
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/catalog', require('./routes/feed'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/analytics-tracking', require('./routes/analytics-tracking'));
app.use('/api/integrations/facebook', require('./routes/integrations'));
app.use('/api/meta-app', require('./routes/metaApp'));

// Serve Static Frontend
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// Server Health Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        uptime: process.uptime(),
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: Date.now()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    await connectDB();
    console.log(`🚀 STORE BACKEND ACTIVE ON PORT ${PORT}`);
});
