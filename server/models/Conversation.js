// Import Mongoose to define models and schemas for MongoDB.
const mongoose = require('mongoose');

// Define the schema for a conversation.
const conversationSchema = new mongoose.Schema({
    // Array of participant IDs. References the 'User' model to form relationships between this model and the User model.
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Subdocument array for messages in the conversation.
    messages: [{
        // Reference to the sender's user ID. This establishes a relationship to the User model.
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // Display name of the sender. Stored directly within the message for quick access without needing to join data.
        senderDisplayName: String,
        // Content of the message.
        text: String,
        // Date and time when the message was created. Defaults to the current date and time upon creation of the message.
        createdAt: { type: Date, default: Date.now }
    }]
});

// Compile the schema into a model which will create a 'conversations' collection in MongoDB when messages are created and saved.
module.exports = mongoose.model('Conversation', conversationSchema);
