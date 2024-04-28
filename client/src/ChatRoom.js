import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageContext } from './MessageContext';
import io from 'socket.io-client';

function ChatRoom({ userProfile }) {
    const { conversationId } = useParams();
    const { currentConversation, setCurrentConversation } = useContext(MessageContext);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const [otherUserDisplayName, setOtherUserDisplayName] = useState("");

    // Connect to Socket.IO server and clean up on unmount
    useEffect(() => {
        const newSocket = io('http://localhost:8888');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('register', userProfile.userId);
        });

        newSocket.on('receiveMessage', message => {
            console.log('Received message:', message);
            if (message.conversationId === conversationId) {
                // Update the conversation with the new message
                setCurrentConversation(prev => ({
                    ...prev,
                    messages: [...prev.messages, message]
                }));
            }
        });
        
        return () => {
            newSocket.off('connect');
            newSocket.off('receiveMessage');
            newSocket.close();
        };
    }, [conversationId, userProfile.userId]);

    

    // Auto-scroll to the latest message
    useEffect(() => {
        if (currentConversation?.messages.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentConversation?.messages]);

    const handleSendMessage = () => {
        if (newMessage.trim() !== "") {
            socket.emit('sendMessage', {
                senderId: userProfile.userId,
                senderDisplayName: userProfile.displayName,
                text: newMessage,
                conversationId: currentConversation._id
            });

            
            setCurrentConversation(prev => ({
                ...prev,
                messages: [...prev.messages, {
                    sender: userProfile.userId, senderDisplayName: userProfile.displayName, text: newMessage, createdAt: new Date()
                }]
            }));

            setNewMessage("");
        }
    };

    // Fetch the specific conversation when the component mounts or the conversationId changes
    useEffect(() => {
        if (conversationId) {
            fetch(`http://localhost:8888/api/conversations/${conversationId}`)
                .then(response => response.json())
                .then(conversation => {
                    setCurrentConversation(conversation);
                })
                .catch(error => console.error('Failed to fetch conversation:', error));
        }
    }, [conversationId, setCurrentConversation]);

    return (
        <div className="middle-content">
            <h1>Chat</h1>
            {currentConversation ? (
                <>
                    <div className="messages">
                        {currentConversation.messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender === userProfile.userId ? 'sent' : 'received'}`}>
                                {/* Display the sender's display name and the text message */}
                                <div className="message-details">
                                    <strong>{msg.senderDisplayName}: </strong>{msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
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
