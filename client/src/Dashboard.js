// Import necessary React hooks and Bootstrap components.
import { useState, useEffect } from "react";
import { Container, Form, Button, InputGroup } from "react-bootstrap";
import SpotifyWebApi from 'spotify-web-api-js'; // Spotify API client for JavaScript
import Player from "./Player"; // Component to play selected tracks
import TrackSearchResult from "./TrackSearchResult"; // Component to display each search result

export default function Dashboard({ spotifyApi, spotifyToken }) {
    const [isExpanded, setIsExpanded] = useState(false); // State to control whether the player is expanded
    const [search, setSearch] = useState(""); // State for storing the search query input by the user
    const [searchResults, setSearchResults] = useState([]); // State for storing search results from Spotify
    const [nowPlaying, setNowPlaying] = useState(); // State for storing the currently playing track

    // Function to set a track as currently playing when selected from search results
    function chooseTrack(track) {
        setNowPlaying(track);
    }

    // Effect hook to perform search on Spotify based on the user's input
    useEffect(() => {
        if (!search) return setSearchResults([]); // Clear search results if the search input is empty
        if (!spotifyToken) return; // Do nothing if there is no valid Spotify token
        
        let cancel = false; // Flag to cancel the search request if the component unmounts
        spotifyApi.searchTracks(search).then(res => {
            if (cancel) return; // Check if the effect cleanup function has been called
            setSearchResults(res.tracks.items.map(track => {
                // Find the smallest album image for display purposes
                const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                    if (image.height < smallest.height) return image;
                    return smallest;
                }, track.album.images[0]);

                // Map track details needed for displaying search results and managing play queue
                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url
                };
            }));
        });
        return () => cancel = true; // Set the cancel flag on cleanup to ignore any unresolved search requests
    }, [search, spotifyToken]); // Re-run the effect whenever search query or token changes

    // Function to determine and set the height of the player based on its state (expanded/collapsed)
    const getHeight = () => {
        if (isExpanded && searchResults.length > 0) return '800px'; // Larger size when expanded with results
        if (searchResults.length > 0) return '250px'; // Intermediate size with results
        return '150px'; // Minimum size when collapsed without results
    };

    // Styles for the player's container: fixed positioning at the bottom right of the screen
    const dashboardStyle = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '600px',
        height: getHeight(), // Dynamic height based on state
        backgroundColor: '#1DB954', // Spotify's brand color
        overflow: 'hidden',
        transition: 'width 0.5s, height 0.5s', // Smooth transitions for resizing
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.5)', // Subtle shadow for 3D effect
        cursor: 'pointer', 
    };

    // Render the player component with interactive UI for searching and playing music
    return (
        <Container
            className="d-flex flex-column py-2"
            style={dashboardStyle}
            onMouseEnter={() => setIsExpanded(true)} // Expand on mouse enter
            onMouseLeave={() => setIsExpanded(false)} // Collapse on mouse leave
        >
            <InputGroup>
                <Form.Control 
                    type="text" 
                    placeholder="Search Songs/Artists" 
                    value={search}
                    onChange={e => setSearch(e.target.value)} // Update search query on change
                />
                <Button style={{ backgroundColor: 'white', borderColor: 'gray', color: 'black' }} 
                                onClick={() => { setSearch(''); setSearchResults([]); }}>
                        Clear
                </Button>
            </InputGroup>
            <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
                {/* Render search results */}
                {searchResults.map(track => (
                    <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack} />
                ))}
            </div>
            <Player spotifyToken={spotifyToken} trackUri={nowPlaying?.uri} />
        </Container>
    );
}
