// Import necessary React hooks, router link, Bootstrap components, Axios for HTTP requests, and SearchContext.
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Form, Button, Card, FormCheck } from 'react-bootstrap';
import axios from 'axios';
import { SearchContext } from './SearchContext'; // Context for sharing search criteria across components

function FeedPage({ userProfile }) {
    // Context to access global search criteria.
    const { searchCriteria } = useContext(SearchContext);
    // State to handle the content of a new post.
    const [content, setContent] = useState('');
    // State for managing tags related to artist, song, and album.
    const [tags, setTags] = useState({ artist: '', song: '', album: '' });
    // State to store the list of posts fetched from the server.
    const [posts, setPosts] = useState([]);
    // State to toggle between all posts or only those from followed users.
    const [showFollowedPostsOnly, setShowFollowedPostsOnly] = useState(false);

    // Function to fetch posts based on the current filters and toggle state.
    const fetchPosts = async (followedOnly = showFollowedPostsOnly) => {
        try {
            const userId = userProfile ? userProfile.userId : null;
            const endpoint = `http://localhost:8888/posts`;
            const params = {
                artist: tags.artist,
                song: tags.song,
                album: tags.album,
                search: searchCriteria,
                followedOnly: followedOnly,
                userId: userId
            };
            const response = await axios.get(endpoint, { params });
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    // Fetch posts when the component mounts and when search criteria or tags change.
    useEffect(() => {
        fetchPosts();
    }, [searchCriteria, tags]);

    // Handle the form submission for creating a new post.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userProfile) {
            alert("You need to be logged in to post.");
            return;
        }
        const post = {
            content,
            tags,
            user: userProfile.spotifyId
        };
        try {
            await axios.post('http://localhost:8888/posts', post);
            setContent('');
            setTags({ artist: '', song: '', album: '' });
            fetchPosts(); // Refetch posts to include the new post
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post');
        }
    };

    // Toggle the state to show only posts from followed users and refetch posts.
    const toggleShowFollowedPostsOnly = () => {
        setShowFollowedPostsOnly(prevState => {
            const newState = !prevState;
            fetchPosts(newState);
            return newState;
        });
    };

    // Fetch posts when the toggle for showing followed posts only changes.
    useEffect(() => {
        fetchPosts(); // This will now be called whenever the checkbox value changes
    }, [showFollowedPostsOnly]);

    // Function to delete a post.
    const deletePost = async (postId) => {
        try {
            await axios.delete(`http://localhost:8888/posts/${postId}`);
            fetchPosts(); // Refetch posts to update the UI
        } catch (error) {
            console.error('Failed to delete the post:', error);
            alert('Failed to delete the post');
        }
    };

    // Function to like a post and update the post's state.
    const likePost = async (postId) => {
        try {
            const { data } = await axios.post(`http://localhost:8888/posts/${postId}/like`, { userId: userProfile.userId });
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return { ...post, likes: data.likes, likesCount: data.likesCount };
                }
                return post;
            }));
        } catch (error) {
            console.error('Error liking the post:', error);
        }
    };

    // Function to render posts using the Card component.
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
                            <button className="like-button" onClick={() => likePost(post._id)}>
                                Like ({post.likes.length})
                            </button>
                            <button className="reply-button">Reply</button>
                            {userProfile && userProfile.spotifyId === post.user.spotifyId && <button className="delete-button" onClick={() => deletePost(post._id)}>Delete</button>}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        ));
    };

    // Main component rendering.
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
                <Button variant="primary" type="submit">Post</Button>
                <FormCheck
                    type="checkbox"
                    label="Show only followed users' posts"
                    checked={showFollowedPostsOnly}
                    onChange={toggleShowFollowedPostsOnly}
                    className="mb-3"
                />
            </Form>
            {renderPosts()}
        </Container>
    );
}

export default FeedPage;
