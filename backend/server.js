
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

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

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
// Check for standard production flags OR Railway environment
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
    // Resolve the dist path relative to backend/server.js
    // path.resolve(__dirname, '..', 'dist') handles both VPS and Railway folder structures
    const distPath = path.resolve(__dirname, '..', 'dist');
    
    // Serve static files from /dist
    app.use(express.static(distPath));

    // Catch-all route to serve index.html for React Router
    app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error("Error sending index.html:", err);
                res.status(500).send("Frontend build (dist folder) not found. Run 'npm run build' first.");
            }
        });
    });
}

// Port: Use environment variable or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
