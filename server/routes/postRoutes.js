const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();



router.get('/', async (req, res) => {
    try {
        let query = {};

        if (req.query.followedOnly === 'true' && req.query.userId) {
            // Fetch the list of user IDs the current user is following
            const user = await User.findById(req.query.userId);
            if (!user) return res.status(404).json({ message: "User not found" });
            query.user = { $in: user.following }; // Filter posts by followed users
        }

        // Handle search functionality
        if (req.query.search) {
            const users = await User.find({ displayName: { $regex: req.query.search, $options: 'i' } });
            const userIds = users.map(user => user._id);

            // Apply general search filter
            query.$or = [
                { 'tags.artist': { $regex: req.query.search, $options: 'i' } },
                { 'tags.song': { $regex: req.query.search, $options: 'i' } },
                { 'tags.album': { $regex: req.query.search, $options: 'i' } },
                { 'user': { $in: userIds } }
            ];

        }
        // Fetch posts based on the constructed query
        const posts = await Post.find(query).populate('user', 'displayName profileImage spotifyId').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const hasLiked = post.likes.includes(userId);
        if (hasLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.status(200).json({ likes: post.likes, likesCount: post.likes.length });
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

router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        await post.deleteOne();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
