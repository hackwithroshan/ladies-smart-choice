
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize Cron Jobs
require('./cronJobs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
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

// --- Unified Frontend Serving (Railway & VPS) ---
// Resolve the dist folder path. In standard setup, dist is in the root.
// If server.js is in /app/backend, dist is at /app/dist.
const distPath = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log(`Checking for frontend build at: ${distPath}`);

if (fs.existsSync(distPath)) {
    console.log('Frontend build found. Serving static files...');
    app.use(express.static(distPath));

    // Catch-all route for React Router
    app.get('*', (req, res) => {
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send("Build exists but index.html is missing. Try 'npm run build' again.");
        }
    });
} else {
    console.warn('WARNING: dist folder not found. API is running, but frontend will not be served.');
    app.get('/', (req, res) => {
        res.status(500).json({
            error: "Frontend build (dist) not found.",
            instruction: "Please run 'npm run build' in the project root before starting the server.",
            currentPath: distPath
        });
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
