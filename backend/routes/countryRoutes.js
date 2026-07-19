const express = require('express');
const router = express.Router();
const Country = require('../models/countryModel'); // Imports your Mongoose model

// Get ALL countries with ALL their data for the React Game Engine
router.get('/', async (req, res) => {
  try {
    const countries = await Country.find({}).sort('name');
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;