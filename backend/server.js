
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Cron Jobs
require('./cronJobs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection - Simplified for stability
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('CRITICAL: MONGO_URI is not defined in environment variables.');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Don't exit the process, let the server run so we can see logs
    }
};
connectDB();

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

// --- Serve Frontend in Production ---
// We use process.cwd() to get the project root where 'dist' lives
const distPath = path.join(process.cwd(), 'dist');

if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    console.log('Production mode detected. Serving from:', distPath);
    
    // Serve static files
    app.use(express.static(distPath));

    // Catch-all route
    app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error("Dist folder or index.html not found at:", indexPath);
                res.status(404).send("Frontend build not found. Please run 'npm run build' first.");
            }
        });
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}

// Port: Railway automatically sets PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Current directory:', process.cwd());
});
