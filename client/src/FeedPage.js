import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Form, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { SearchContext } from './SearchContext'; // Make sure this is set up as described earlier

function FeedPage({ userProfile }) {
    const { searchCriteria } = useContext(SearchContext);
    const [content, setContent] = useState('');
    const [tags, setTags] = useState({ artist: '', song: '', album: '' });
    const [posts, setPosts] = useState([]);

    const fetchPosts = async () => {
        try {
            const response = await axios.get(`http://localhost:8888/posts`, {
                params: { artist: tags.artist, song: tags.song, album: tags.album, search: searchCriteria }
            });
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [searchCriteria, tags]); // Refetch posts when search criteria or tags change

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userProfile) {
            alert("You need to be logged in to post.");
            return;
        }
        try {
            const post = {
                content,
                tags,
                user: userProfile.spotifyId
            };
            await axios.post('http://localhost:8888/posts', post);
            setContent('');
            setTags({ artist: '', song: '', album: '' });
            fetchPosts(); // Refetch posts to include the new post
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post');
        }
    };

    useEffect(() => {
        fetchPosts(); // Assuming this function fetches the posts and logs them
      }, [userProfile]);

      const deletePost = async (postId) => {
        try {
            await axios.delete(`http://localhost:8888/posts/${postId}`);
            fetchPosts(); // Refetch posts to update the UI
        } catch (error) {
            console.error('Failed to delete the post:', error);
            alert('Failed to delete the post');
        }
    };
      
    const renderPosts = () => {
        return posts.map((post) => (
            <Card key={post._id} className="mb-3">
                <Card.Body>
                    <div className="post-header">
                        <div className="user-info">
                        <Link to={`/profile/${post.user.displayName}`}>
                            <img src={post.user.profileImage || 'https://via.placeholder.com/150'} alt="Profile" className="post-profile-image" />
                        </Link>
                            <div>{post.user.displayName}</div> 
                        </div>
                        <div className="tag-section">
                            {post.tags.artist && <div className="tag">Artist: {post.tags.artist}</div>}
                            {post.tags.song && <div className="tag">Song: {post.tags.song}</div>}
                            {post.tags.album && <div className="tag">Album: {post.tags.album}</div>}
                        </div>
                    </div>
                    <div className="post-main-content">
                        <Card.Text>{post.content}</Card.Text>
                        <div className="button-section">
                            <button className="like-button">Like</button>
                            <button className="reply-button">Reply</button>
                            {userProfile && userProfile.spotifyId === post.user.spotifyId && <button className="delete-button" onClick={() => deletePost(post._id)}>Delete</button>}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        ));
    };

    return (
        <Container className="middle-content">
            <h1>Feed Page</h1>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="postContent">
                    <Form.Label>What's on your mind?</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Write something..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="postTags">
                    <Form.Label>Tags</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Artist"
                        value={tags.artist}
                        onChange={e => setTags({ ...tags, artist: e.target.value })}
                    />
                    <Form.Control
                        type="text"
                        placeholder="Song"
                        value={tags.song}
                        onChange={e => setTags({ ...tags, song: e.target.value })}
                    />
                    <Form.Control
                        type="text"
                        placeholder="Album"
                        value={tags.album}
                        onChange={e => setTags({ ...tags, album: e.target.value })}
                    />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Post
                </Button>
            </Form>
            {renderPosts()}
        </Container>
    );
}

export default FeedPage;
