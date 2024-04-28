// Import necessary React utilities and the Spotify web player component.
import { useState, useEffect } from "react";
import React from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';

export default function Player({ spotifyToken, trackUri }) {
    // State to control playback. Starts as false to ensure music doesn't auto-play unexpectedly.
    const [play, setPlay] = useState(false);

    // When trackUri changes, automatically start playing the new track.
    useEffect(() => {
        setPlay(true);
    }, [trackUri]);

    // Do not render the player if there is no Spotify token available.
    if (!spotifyToken) return null;

    // Styles for the Spotify player, these can be customized as needed.
    const playerStyles = {
        activeColor: '#fff', // Color of the slider and other active elements
        bgColor: '#1DB954', // Background color of the player
        color: '#000', // General color for text and icons
        loaderColor: '#fff', // Color of the loader animation
        sliderColor: '#fff', // Color of the slider
        trackArtistColor: '#000', // Color for the track artist text
        trackNameColor: '#fff', // Color for the track name text
    };

    // Render the SpotifyPlayer component from the react-spotify-web-playback library.
    return (
        <SpotifyPlayer
            token={spotifyToken} // Spotify access token, needed for authorization
            showSaveIcon // Option to show a "save track" icon in the UI
            callback={state => {
                // Callback function to update the play state based on player state changes
                if (!state.isPlaying) setPlay(false);
            }}
            play={play} // Control play state, starts playback if true
            uris={trackUri ? [trackUri] : []} // Array of track URIs to be played, expects an array
            styles={playerStyles} // Apply custom styles to the player
        />
    );
}
