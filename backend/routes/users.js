const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get all users (Admin only)
router.get('/', authMiddleware(true), async (req, res) => {
  try {
    // Exclude passwords from the result
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
