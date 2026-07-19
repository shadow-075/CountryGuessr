const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// 1. "Login" or Create a new user instantly
router.post('/login', async (req, res) => {
  const { username } = req.body;
  try {
    // Look for the user
    let user = await User.findOne({ username });
    
    // If they don't exist, create them instantly!
    if (!user) {
      user = await User.create({ username, totalScore: 0, gamesPlayed: 0 });
    }
    res.json(user);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. Add points to a user's score after a game
router.put('/score', async (req, res) => {
  const { username, score } = req.body;
  try {
    // Find the user and add the score and +1 to games played
    const user = await User.findOneAndUpdate(
      { username },
      { $inc: { totalScore: score, gamesPlayed: 1 } },
      { new: true } // Return the updated user
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 3. Get the Top 10 Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // Sort by totalScore descending (-1), limit to 10
    const leaders = await User.find().sort({ totalScore: -1 }).limit(10);
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;