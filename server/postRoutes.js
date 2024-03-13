const express = require('express');
const Post = require('./models/Post'); // Adjust the path as necessary
const router = express.Router();

// Middleware to check for logged-in users
const requireLogin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }
    next();
};

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'displayName').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new post
router.post('/', requireLogin, async (req, res) => {
    const { content, tags } = req.body;
    const user = req.user._id; // Adjust according to how you store logged-in user information
    const newPost = new Post({
        user,
        content,
        tags: {
            artist: tags.artist || 'none',
            song: tags.song || 'none',
            album: tags.album || 'none'
        }
    });

    try {
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add routes for updating and deleting posts as needed

module.exports = router;
