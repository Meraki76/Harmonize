// Import Mongoose library for MongoDB interactions.
const mongoose = require('mongoose');

// Define the schema for the User model.
const userSchema = new mongoose.Schema({
    // Unique identifier for the user from Spotify. This is marked as required.
    spotifyId: { type: String, required: true },
    // The display name of the user; this is optional in the schema.
    displayName: String,
    // Email address of the user; this is required for contact or identification purposes.
    email: { type: String, required: true },
    // URL to the user's Spotify profile, which provides a direct link to their Spotify account.
    spotifyUrl: String,
    // URL to the user's profile image. This may be used to show the user's picture in the application.
    profileImage: String,
    // The country associated with the user's account, potentially for regional features or content.
    country: String,
    // Array of ObjectIds referring to other User documents that this user is following.
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Array of ObjectIds referring to other User documents who follow this user.
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// Compile the userSchema into a model which can be used to interact with the 'users' collection in MongoDB.
module.exports = mongoose.model('User', userSchema);
