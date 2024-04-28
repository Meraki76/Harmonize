// Import Mongoose to create schemas and models for MongoDB.
const mongoose = require('mongoose');

// Define a schema for replies to a post. This schema is used as a subdocument in the postSchema.
const replySchema = new mongoose.Schema({
    // Reference to the User model. Indicates which user made the reply.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Text content of the reply. It's required so every reply must include some text.
    text: { type: String, required: true },
    // Timestamp for when the reply was created. Automatically set to the current date and time upon creation.
    createdAt: { type: Date, default: Date.now }
});

// Define the main schema for posts.
const postSchema = new mongoose.Schema({
    // Reference to the User model. Indicates which user created the post. This field is required.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Main content of the post. It is also required.
    content: { type: String, required: true },
    // Timestamp for when the post was created. Defaults to the current date and time upon creation.
    createdAt: { type: Date, default: Date.now },
    // Array of user IDs who liked the post. Each ID is a reference to the User model.
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Array of replies, using the replySchema defined above. This allows nesting of reply data directly within a post.
    replies: [replySchema],
    // Optional tags for the post. These default to null if not provided.
    tags: {
        artist: { type: String, default: null },  // Tag for the artist related to the post.
        song: { type: String, default: null },    // Tag for the song related to the post.
        album: { type: String, default: null }    // Tag for the album related to the post.
    }
});

// Compile the postSchema into a model which can be used to interact with the 'posts' collection in MongoDB.
module.exports = mongoose.model('Post', postSchema);
