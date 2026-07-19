const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, // No two players can have the same name
    trim: true 
  },
  totalScore: { 
    type: Number, 
    default: 0 
  },
  gamesPlayed: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);