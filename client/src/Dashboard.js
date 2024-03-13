import { useState, useEffect } from "react";
import { Container, Form, Button, InputGroup } from "react-bootstrap";
import SpotifyWebApi from 'spotify-web-api-js';
import Player from "./Player";
import TrackSearchResult from "./TrackSearchResult";

export default function Dashboard({ spotifyApi, spotifyToken }) {
    const [isExpanded, setIsExpanded] = useState(false); // State to track whether the dashboard is expanded
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [nowPlaying, setNowPlaying] = useState();

    function chooseTrack(track) {
        setNowPlaying(track);
    }

    useEffect(() => {
        if (!search) return setSearchResults([]);
        if (!spotifyToken) return;
        
        let cancel = false;
        spotifyApi.searchTracks(search).then(res => {
            if (cancel) return;
            setSearchResults(res.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                    if (image.height < smallest.height) return image;
                    return smallest;
                }, track.album.images[0]);

                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url
                };
            }));
        });
        return () => cancel = true;
    }, [search, spotifyToken]);

    const getHeight = () => {
        if (isExpanded && searchResults.length > 0) return '800px'; // Expanded height
        if(searchResults.length > 0) return '250px';
        return '150px'; // Default height
    };


    const dashboardStyle = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '600px',
        height: getHeight(),
        backgroundColor: '#1DB954',
        overflow: 'hidden',
        transition: 'width 0.5s, height 0.5s',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
        cursor: 'pointer', // Make it obvious it's interactive
    };

    return (
        <Container
            className="d-flex flex-column py-2"
            style={dashboardStyle}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <InputGroup>
                <Form.Control 
                    type="text" 
                    placeholder="Search Songs/Artists" 
                    value={search}
                    onChange={e => setSearch(e.target.value)} 
                />
                <Button style={{ backgroundColor: 'white', borderColor: 'gray', color: 'black' }} 
                                onClick={() => { setSearch(''); setSearchResults([]); }}>
                        Clear
                </Button>

            </InputGroup>
            <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
                {searchResults.map(track => (
                    <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack} />
                ))}
            </div>
            <Player spotifyToken={spotifyToken} trackUri={nowPlaying?.uri} />
        </Container>
    );

}
