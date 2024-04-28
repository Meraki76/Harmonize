// Import necessary React hooks, router hooks, context, Axios for HTTP requests, and React-Bootstrap components.
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageContext } from './MessageContext';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap';

function FriendsPage({ userProfile }) {
    // Access the conversations array and the function to update it from the context.
    const { conversations, setConversations } = useContext(MessageContext);
    // Hook to programmatically navigate to other routes.
    const navigate = useNavigate();

    // Fetch conversations from the server when the component mounts or the userProfile changes.
    useEffect(() => {
        if (userProfile && userProfile.userId) {
            axios.get(`http://localhost:8888/api/conversations/user/${userProfile.userId}`)
            .then(response => {
                setConversations(response.data); // Update context with fetched conversations
            })
            .catch(error => {
                console.error('Failed to fetch conversations:', error);
                setConversations([]); // Clear conversations in case of error
            });
        }
    }, [setConversations, userProfile]);

    // Function to handle user selection of a conversation.
    const handleSelectConversation = (conversationId) => {
        navigate(`/chat/${conversationId}`); // Navigate to the chat page of the selected conversation.
    };

    // Render the page content.
    return (
        <div className="middle-content">
            <h1>Messages</h1>
            {conversations && conversations.length > 0 ? (
                conversations.map((conversation) => (
                    <Card key={conversation._id} className="mb-3">
                        <Card.Body className="d-flex align-items-center">
                            {/* Display the other participant's profile image and name */}
                            <img src={conversation.otherParticipantProfileImage} alt="Profile" style={{ width: 50, height: 50, borderRadius: '50%', marginRight: 20 }} />
                            <div className="flex-grow-1">
                                <Card.Title>{conversation.otherParticipantDisplayName}</Card.Title>
                            </div>
                            <Button onClick={() => handleSelectConversation(conversation._id)} variant="primary">Open Chat</Button>
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <p>No conversations yet.</p> // Display message if there are no conversations.
            )}
        </div>
    );
}

export default FriendsPage;
