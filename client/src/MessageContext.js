import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
    const [currentConversation, setCurrentConversation] = useState(null);
    const [conversations, setConversations] = useState([]);  // Add this line
    const socket = io('http://localhost:8888');

    useEffect(() => {
        socket.on('receiveMessage', (message) => {
            // Update the current conversation with the new message if it belongs to the same conversation
            if (currentConversation && message.conversationId === currentConversation._id) {
                setCurrentConversation(prev => ({
                    ...prev,
                    messages: [...prev.messages, message]
                }));
            }
            // Optionally update the conversations list if it affects one of the items
            setConversations(prev => prev.map(convo => {
                if (convo._id === message.conversationId) {
                    return { ...convo, lastMessage: message };  // You might need to adjust this depending on your data structure
                }
                return convo;
            }));
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, [currentConversation, conversations]);

    const sendMessage = ({ message, to }) => {
        socket.emit('sendMessage', { message, to, conversationId: to });
    };

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

    // Function to fetch all conversations for a user
    const fetchConversations = (userId) => {
        fetch(`http://localhost:8888/api/conversations/user/${userId}`)
            .then(response => response.json())
            .then(data => {
                setConversations(data);
            })
            .catch(error => {
                console.error('Failed to fetch conversations:', error);
                setConversations([]);  // Ensure it is set to an empty array on error
            });
    };

    return (
        <MessageContext.Provider value={{
            currentConversation,
            fetchConversation,
            sendMessage,
            setCurrentConversation,
            conversations,  // Provide the conversations list
            fetchConversations,  // Provide the fetching method
            setConversations  // Provide the setter function
        }}>
            {children}
        </MessageContext.Provider>
    );
};
