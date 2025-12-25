require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
    process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected: Ladies Smart Choice (Port 5000)'))
    .catch(err => console.error('MongoDB Error:', err.message));

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

// Static Folder for React Build
const distPath = path.resolve(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Backend is running. Please run "npm run build" in the root folder to serve the frontend.');
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Ladies Smart Choice Active on Port ${PORT}`));