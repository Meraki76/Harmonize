// Assuming you have express and your User model imported already
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as necessary

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Server-side route to search users by display name
router.get('/search/:displayName', async (req, res) => {
    try {
        const users = await User.find({
            displayName: { $regex: req.params.displayName, $options: 'i' }
        }).select("-email"); 

        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;
