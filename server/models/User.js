const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true },
  displayName: String,
  email: { type: String, required: true },
  spotifyUrl: String,
  profileImage: String, // Assuming you want to store the URL of the user's profile picture
  country: String,
});

module.exports = mongoose.model('User', userSchema);
