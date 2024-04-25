import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Button } from 'react-bootstrap';

function ProfilePage() {
    const { displayName } = useParams(); // Fetch the display name from URL
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        // First, find the user to confirm existence and get user details
        axios.get(`http://localhost:8888/users/search/${displayName}`)
            .then(response => {
                if (response.data.length > 0) {
                    setUser(response.data[0]);
                    fetchPostsByDisplayName(displayName); // Fetch posts for this user using display name
                } else {
                    setError('User not found');
                }
            })
            .catch(err => {
                setError('Failed to fetch user data');
                console.error(err);
            });
    }, [displayName]);

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

    if (error) {
        return <Container className="middle-content"><p>{error}</p></Container>;
    }

    return (
        <Container className="middle-content">
            {user ? (
                <>
                    <h1>{user.displayName}</h1>
                    <img src={user.profileImage || 'https://via.placeholder.com/150'} alt={`${user.displayName}`} style={{ borderRadius: '50%' }} />
                    <Button onClick={() => {/* Handle messaging logic here */}}>Message</Button>
                    {renderPosts()}
                </>
            ) : (
                <p>Loading user profile...</p>
            )}
        </Container>
    );
}

export default ProfilePage;
