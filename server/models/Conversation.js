// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderDisplayName: String,  
        text: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Conversation', conversationSchema);
