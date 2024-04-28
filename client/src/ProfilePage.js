import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageContext } from './MessageContext';
import axios from 'axios';
import { Container, Card, Button } from 'react-bootstrap';

function ProfilePage({ userProfile, spotifyToken }) {
    const { displayName } = useParams(); // Fetch the display name from URL
    const { startConversation } = useContext(MessageContext);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);  // State to track if the current user is following



    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://localhost:8888/users/search/${displayName}`);
                if (response.data.length > 0) {
                    const userData = response.data[0];
                    setUser(userData);
                    setIsFollowing(userData.followers.includes(userProfile.userId));
                    fetchPostsByDisplayName(displayName); // Fetch posts for this user using display name
                } else {
                    setError('User not found');
                }
            } catch (err) {
                setError('Failed to fetch user data');
                console.error(err);
            }
        };
        fetchUserData();
    }, [displayName, userProfile.userId]);

    // Fetch posts based on the display name
    const fetchPostsByDisplayName = (displayName) => {
        axios.get(`http://localhost:8888/posts`, { params: { search: displayName } })
            .then(response => {
                setPosts(response.data);
            })
            .catch(err => {
                console.error('Error fetching posts:', err);
                setError('Failed to fetch posts');
            });
    };

    const renderPosts = () => {
        return posts.map((post) => (
            <Card key={post._id} className="mb-3">
                <Card.Body>
                    <div className="post-header">
                        <div className="user-info">
                            <img src={post.user.profileImage || 'https://via.placeholder.com/150'} alt="Profile" className="post-profile-image" />
                            <div>{post.user.displayName}</div>
                        </div>
                        <div className="tag-section">
                            {post.tags.artist && <div className="tag">Artist: {post.tags.artist}</div>}
                            {post.tags.song && <div className="tag">Song: {post.tags.song}</div>}
                            {post.tags.album && <div className="tag">Album: {post.tags.album}</div>}
                        </div>
                    </div>
                    <Card.Text>{post.content}</Card.Text>
                </Card.Body>
            </Card>
        ));
    };

    const handleSendMessage = () => {
      const otherUserId = user._id;
      const currentUserId = userProfile.userId;
      
      fetch('http://localhost:8888/api/conversations/start', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentUserId, otherUserId })
      })
      .then(response => response.json())
      .then(conversation => {
          navigate(`/chat/${conversation._id}`);
      })
      .catch(error => {
          console.error('Error starting conversation:', error);
          alert('Failed to start conversation');
      });
  };

    if (error) {
        return <Container className="middle-content"><p>{error}</p></Container>;
    }

    const followUser = async () => {
        if (!userProfile || userProfile.userId === user._id) {
          alert("You cannot follow yourself.");
          return;
        }
        try {
          const response = await axios.post(`http://localhost:8888/users/${user._id}/follow`, { userId: userProfile.userId });
          if (response.status === 200) {
            setIsFollowing(true);
            setUser(prev => ({
              ...prev,
              followers: [...prev.followers, userProfile.userId]
            }));
            alert("You are now following " + user.displayName);
          } else {
            alert("Failed to follow: " + response.data.message);
          }
        } catch (error) {
          console.error("Error following user: ", error.response ? error.response.data.message : error.message);
          alert("Failed to follow due to an error.");
        }
      };

    const unfollowUser = async (userIdToUnfollow) => {
        await axios.post(`http://localhost:8888/users/${userIdToUnfollow}/unfollow`, { userId: userProfile.userId })
            .then(() => {
                setIsFollowing(false);
                setUser(prev => ({
                    ...prev,
                    followers: prev.followers.filter(id => id !== userProfile.userId)
                }));
                alert("You have unfollowed " + user.displayName);
            })
            .catch(error => {
                console.log("Error unfollowing user: " + error);
                alert("Failed to unfollow");
            });
    };
    
    return (
        <Container className="middle-content">
            {user ? (
                <>
                    <h1>{user.displayName} - Followers: {user.followers.length}</h1>
                    <img src={user.profileImage || 'https://via.placeholder.com/150'} alt={`${user.displayName}`} style={{ borderRadius: '50%' }} />
                    {userProfile.userId !== user._id && (
                        <>
                            <Button onClick={handleSendMessage}>Message</Button>
                            {isFollowing ? (
                                <Button onClick={() => unfollowUser(user._id)}>Unfollow</Button>
                            ) : (
                                <Button onClick={followUser}>Follow</Button>
                            )}
                        </>
                    )}
                    {renderPosts()}
                </>
            ) : (
                <p>Loading user profile...</p>
            )}
        </Container>
    );
}

export default ProfilePage;
