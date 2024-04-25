const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true },
  displayName: String,
  email: { type: String, required: true },
  spotifyUrl: String,
  profileImage: String,
  country: String,
});

module.exports = mongoose.model('User', userSchema);
