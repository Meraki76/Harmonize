// Import necessary React utilities and Socket.IO client for real-time communication.
import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

// Create a context that will be used to provide and consume the message-related data.
export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
    // State for managing the current active conversation.
    const [currentConversation, setCurrentConversation] = useState(null);
    // State to store a list of all conversations related to the user.
    const [conversations, setConversations] = useState([]);
    // Establish a socket connection to the server.
    const socket = io('http://localhost:8888');

    // Effect hook to handle incoming messages via WebSocket.
    useEffect(() => {
        socket.on('receiveMessage', (message) => {
            // Update the current conversation with the new message if the message belongs to it.
            if (currentConversation && message.conversationId === currentConversation._id) {
                setCurrentConversation(prev => ({
                    ...prev,
                    messages: [...prev.messages, message]
                }));
            }
            // Update the list of conversations when a new message is received.
            setConversations(prev => prev.map(convo => {
                if (convo._id === message.conversationId) {
                    // Update last message for the conversation list.
                    return { ...convo, lastMessage: message };  // Adjust based on your data structure.
                }
                return convo;
            }));
        });

        // Clean up by removing the event listener when the component unmounts.
        return () => {
            socket.off('receiveMessage');
        };
    }, [currentConversation, conversations]);

    // Function to send a message using the socket.
    const sendMessage = ({ message, to }) => {
        socket.emit('sendMessage', { message, to, conversationId: to });
    };

    // Function to fetch a specific conversation by ID.
    const fetchConversation = (conversationId) => {
        fetch(`http://localhost:8888/api/conversations/${conversationId}`)
            .then(response => response.json())
            .then(data => {
                setCurrentConversation(data);
            })
            .catch(error => {
                console.error('Failed to fetch conversation:', error);
            });
    };

    // Function to fetch all conversations for a specific user.
    const fetchConversations = (userId) => {
        fetch(`http://localhost:8888/api/conversations/user/${userId}`)
            .then(response => response.json())
            .then(data => {
                setConversations(data);
            })
            .catch(error => {
                console.error('Failed to fetch conversations:', error);
                setConversations([]);  // Reset to empty array on error to clear previous state.
            });
    };

    // Render the provider with its value containing state and functions that can be accessed by consumer components.
    return (
        <MessageContext.Provider value={{
            currentConversation,
            fetchConversation,
            sendMessage,
            setCurrentConversation,
            conversations,  // Make conversations list available.
            fetchConversations,  // Make method to fetch conversations available.
            setConversations  // Make setter function for conversations available.
        }}>
            {children}  
        </MessageContext.Provider>  // Render children within the provider to allow access to the context.
    );
};
