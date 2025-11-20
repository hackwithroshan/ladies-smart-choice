
const express = require('express');
const HeaderSetting = require('../models/HeaderSetting');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get header settings (public)
router.get('/header', async (req, res) => {
  try {
    const settings = await HeaderSetting.findOne({ uniqueId: 'main_header_settings' });
    if (!settings) {
      return res.status(404).json({ message: 'Header settings not found.' });
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update header settings (Admin only)
router.put('/header', authMiddleware(true), async (req, res) => {
  const { logoText, phoneNumber, topBarLinks, mainNavLinks } = req.body;
  try {
    let settings = await HeaderSetting.findOneAndUpdate(
      { uniqueId: 'main_header_settings' },
      { logoText, phoneNumber, topBarLinks, mainNavLinks },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
