import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageContext } from './MessageContext';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap';

function FriendsPage({ userProfile }) {
    const { conversations, setConversations } = useContext(MessageContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (userProfile && userProfile.userId) {
            axios.get(`http://localhost:8888/api/conversations/user/${userProfile.userId}`)
            .then(response => {
                setConversations(response.data);
            })
            .catch(error => {
                console.error('Failed to fetch conversations:', error);
                setConversations([]);
            });
        }
    }, [setConversations, userProfile]);

    const handleSelectConversation = (conversationId) => {
        navigate(`/chat/${conversationId}`);
    };

    return (
        <div className="middle-content">
            <h1>Messages</h1>
            {conversations && conversations.length > 0 ? (
                conversations.map((conversation) => (
                    <Card key={conversation._id} className="mb-3">
                        <Card.Body className="d-flex align-items-center">
                            <img src={conversation.otherParticipantProfileImage} alt="Profile" style={{ width: 50, height: 50, borderRadius: '50%', marginRight: 20 }} />
                            <div className="flex-grow-1">
                                <Card.Title>{conversation.otherParticipantDisplayName}</Card.Title>
                            </div>
                            <Button onClick={() => handleSelectConversation(conversation._id)} variant="primary">Open Chat</Button>
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <p>No conversations yet.</p>
            )}
        </div>
    );
}

export default FriendsPage;
