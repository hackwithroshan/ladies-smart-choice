
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
const campaignRoutes = require('./routes/campaigns');
const discountRoutes = require('./routes/discounts');
const seedDatabase = require('./seed');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Connection (Serverless Optimized) ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autocosmic';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    console.log('MongoDB Connected');
    
    // Only seed if we just connected and aren't in a serverless warm start (optional check)
    // For simplicity, we'll run it, but in prod you might want a dedicated seed script
    // seedDatabase(); 
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Connect immediately if running locally
if (process.env.NODE_ENV !== 'production') {
    connectDB().then(() => seedDatabase()).catch(console.error);
} else {
    // In serverless, we connect inside the request flow or rely on the cached connection
    connectDB(); 
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
app.use('/api/campaigns', campaignRoutes);
app.use('/api/discounts', discountRoutes);

// --- Start Server (Only if running directly) ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
