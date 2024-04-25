const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();



router.get('/', async (req, res) => {
    try {
        let query = {};
        if (req.query.search) {
            const users = await User.find({
                displayName: { $regex: req.query.search, $options: 'i' }
            });

            const userIds = users.map(user => user._id);

            query = { $or: [
                { 'tags.artist': { $regex: req.query.search, $options: 'i' } },
                { 'tags.song': { $regex: req.query.search, $options: 'i' } },
                { 'tags.album': { $regex: req.query.search, $options: 'i' } },
                { 'user': { $in: userIds } }  
            ]};
        }

        const posts = await Post.find(query).populate('user', 'displayName profileImage').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create a new post
router.post('/', async (req, res) => {
    const { content, tags, user: spotifyId } = req.body; 
    try {
    
        const user = await User.findOne({ spotifyId: spotifyId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newPost = new Post({
            user: user._id, 
            content,
            tags: {
                artist: tags.artist,
                song: tags.song,
                album: tags.album
            }
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


module.exports = router;
