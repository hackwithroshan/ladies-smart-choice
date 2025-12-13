
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Cron Jobs for scheduled tasks (e.g., feed generation)
require('./cronJobs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Serve Publicly Generated Files (e.g., Product Feeds) ---
app.use('/feeds', express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Routes
app.get('/api', (req, res) => {
    res.send('API is running...');
});

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
// Refactored: All feed/catalog routes are now under /api/catalog
app.use('/api/catalog', require('./routes/feed')); 
app.use('/api/integrations', require('./routes/integrations'));
// NEW: Shipping Integration Routes
app.use('/api/shipping', require('./routes/shipping'));

// Efficient App Data route
app.use('/api/app-data', require('./routes/appData'));

// Models (for registration with Mongoose)
require('./models/ContactSubmission');
require('./models/StoreDetails');


// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
    // Set static folder - assuming the frontend is built into a 'dist' folder in the root
    app.use(express.static(path.join(__dirname, '../dist')));

    // For any route that is not an API route, serve the React app's index.html
    // This should be after all API routes
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
    });
}


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
