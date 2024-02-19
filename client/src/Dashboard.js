import { useState } from "react";
import { Container, Form } from "react-bootstrap";
import SpotifyWebApi from 'spotify-web-api-js';
import { useEffect } from "react";
import Player from "./Player";
import TrackSearchResult from "./TrackSearchResult";
const spotifyApi = new SpotifyWebApi();

export default function Dashboard({ spotifyApi, spotifyToken }) {
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    console.log(searchResults)
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
                // Get the smallest album image by reducing the array of images to the smallest one by height.
                const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                    if (image.height < smallest.height) return image
                    return smallest
                }, track.album.images[0])

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

    

    return (
        <Container className="d-flex flex-column py-2" style={{
         height: "100vh" }}>
            <Form.Control 
                type="text" 
                placeholder="Search Songs/Artists" 
                value={search}
                onChange={e => setSearch(e.target.value)} 
            />
            <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
                {searchResults.map(track => (
                    <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack} />
                ))}
            </div>
            <div><Player spotifyToken={spotifyToken} trackUri={nowPlaying?.uri} /></div>
        </Container>
    );
}
