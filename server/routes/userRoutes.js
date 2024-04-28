// Assuming you have express and your User model imported already
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as necessary to where your User model is located.

/**
 * Server-side route to search for users by their display name.
 * It performs a case-insensitive search using MongoDB's regex capabilities.
 */
router.get('/search/:displayName', async (req, res) => {
    try {
        // Attempt to find any users that match the displayName parameter passed in the URL.
        // The search is case-insensitive ($options: 'i') to improve usability.
        const users = await User.find({
            displayName: { $regex: req.params.displayName, $options: 'i' }
        }).select("-email"); // Exclude the email field from the results for privacy.

        // Check if the search returned any users. If not, return a 404 with a message.
        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }
        
        // If users are found, return them in the response.
        res.json(users);
    } catch (error) {
        // If an error occurs during the database query, return a 500 status with the error message.
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; // Export the router to be used by the main application.
