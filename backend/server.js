
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const slideRoutes = require('./routes/slides');
const seedDatabase = require('./seed');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
// Use a cached connection logic or standard connect (Mongoose buffers internally)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autocosmic';

if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully.');
      seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the AutoCosmic Backend API!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/slides', slideRoutes);

// --- Start Server (Only if running directly) ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
