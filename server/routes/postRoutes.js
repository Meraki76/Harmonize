const express = require('express');
const Post = require('../models/Post'); // Import the Post model.
const User = require('../models/User'); // Import the User model.
const router = express.Router(); // Create an Express router to define routes.

// GET route to retrieve posts. This can filter posts by followers or search criteria.
router.get('/', async (req, res) => {
    try {
        let query = {};

        // Filter posts to only show those created by users the current user is following.
        if (req.query.followedOnly === 'true' && req.query.userId) {
            const user = await User.findById(req.query.userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            query.user = { $in: user.following }; // Uses MongoDB's $in operator to filter.
        }

        // Apply search filters based on artist, song, album, or user display name.
        if (req.query.search) {
            const users = await User.find({ displayName: { $regex: req.query.search, $options: 'i' } });
            const userIds = users.map(user => user._id);

            query.$or = [
                { 'tags.artist': { $regex: req.query.search, $options: 'i' } },
                { 'tags.song': { $regex: req.query.search, $options: 'i' } },
                { 'tags.album': { $regex: req.query.search, $options: 'i' } },
                { 'user': { $in: userIds } }
            ];
        }

        // Fetch the posts from the database, sort by creation date, and populate user details.
        const posts = await Post.find(query).populate('user', 'displayName profileImage spotifyId').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST route to toggle like status on a post.
router.post('/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Toggle like status.
        const hasLiked = post.likes.includes(userId);
        if (hasLiked) {
            post.likes.pull(userId); // Remove like if already liked.
        } else {
            post.likes.push(userId); // Add like if not already liked.
        }
        await post.save();
        res.status(200).json({ likes: post.likes, likesCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST route to create a new post.
router.post('/', async (req, res) => {
    const { content, tags, user: spotifyId } = req.body;
    try {
        const user = await User.findOne({ spotifyId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create a new post and save it to the database.
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

// DELETE route to delete a post by its ID.
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        await post.deleteOne();
        res.status(204).send(); // Send a 204 No Content status after successful deletion.
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; // Export the router to be mounted by the main application.
