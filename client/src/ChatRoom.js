// Import necessary React hooks, router functionality, the MessageContext, and Socket.IO client.
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageContext } from './MessageContext';
import io from 'socket.io-client';

function ChatRoom({ userProfile }) {
    // Extract the conversation ID from the URL parameters.
    const { conversationId } = useParams();
    // Access the current conversation state and setter from the context.
    const { currentConversation, setCurrentConversation } = useContext(MessageContext);
    // State for handling new message input from the user.
    const [newMessage, setNewMessage] = useState("");
    // Reference for the scrollable area to ensure the view is moved to the latest message.
    const messagesEndRef = useRef(null);
    // State to manage the socket connection instance.
    const [socket, setSocket] = useState(null);

    // Connect to Socket.IO server when component mounts and clean up on unmount.
    useEffect(() => {
        const newSocket = io('http://localhost:8888');  // Connect to the Socket.IO server.
        setSocket(newSocket);  // Store the socket instance in state.

        // Register the user with their userId when the socket connects.
        newSocket.on('connect', () => {
            newSocket.emit('register', userProfile.userId);
        });

        // Handle incoming messages.
        newSocket.on('receiveMessage', message => {
            console.log('Received message:', message);
            // If the message belongs to the current conversation, add it to the conversation.
            if (message.conversationId === conversationId) {
                setCurrentConversation(prev => ({
                    ...prev,
                    messages: [...prev.messages, message]
                }));
            }
        });

        // Clean up by removing event listeners and closing the socket when the component unmounts.
        return () => {
            newSocket.off('connect');
            newSocket.off('receiveMessage');
            newSocket.close();
        };
    }, [conversationId, userProfile.userId]);

    // Automatically scroll to the most recent message when the list of messages updates.
    useEffect(() => {
        if (currentConversation?.messages.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentConversation?.messages]);

    // Function to handle sending messages.
    const handleSendMessage = () => {
        if (newMessage.trim() !== "") {
            // Emit a 'sendMessage' event to the server with the message data.
            socket.emit('sendMessage', {
                senderId: userProfile.userId,
                senderDisplayName: userProfile.displayName,
                text: newMessage,
                conversationId: currentConversation._id
            });

            // Update local conversation state with the new message.
            setCurrentConversation(prev => ({
                ...prev,
                messages: [...prev.messages, {
                    sender: userProfile.userId, 
                    senderDisplayName: userProfile.displayName, 
                    text: newMessage, 
                    createdAt: new Date()
                }]
            }));

            // Clear the input field.
            setNewMessage("");
        }
    };

    // Fetch the specific conversation data when the component mounts or the conversationId changes.
    useEffect(() => {
        if (conversationId) {
            fetch(`http://localhost:8888/api/conversations/${conversationId}`)
                .then(response => response.json())
                .then(conversation => {
                    setCurrentConversation(conversation);  // Set the fetched conversation into the state.
                })
                .catch(error => console.error('Failed to fetch conversation:', error));
        }
    }, [conversationId, setCurrentConversation]);

    // Render the chat interface.
    return (
        <div className="middle-content">
            <h1>Chat</h1>
            {currentConversation ? (
                <>
                    <div className="messages">
                        {/* Map through each message in the conversation and display them. */}
                        {currentConversation.messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender === userProfile.userId ? 'sent' : 'received'}`}>
                                <div className="message-details">
                                    <strong>{msg.senderDisplayName}: </strong>{msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} /> {/* Reference to scroll to the latest message. */}
                    </div>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="message-input"
                    />
                    <button onClick={handleSendMessage} className="send-button">Send</button>
                </>
            ) : (
                <p>Loading conversation or start a new chat...</p>
            )}
        </div>
    );
}

export default ChatRoom;
