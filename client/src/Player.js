import { useState, useEffect } from "react";
import React from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';

export default function Player({ spotifyToken, trackUri }) {
    const [play, setPlay] = React.useState(false);

    useEffect(() => {
        setPlay(true);
    }, [trackUri]);

    if (!spotifyToken) return null;

    const playerStyles = {
        activeColor: '#fff', // White color for currently playing track for contrast
        bgColor: '#1DB954', // Your vibrant green background color
        color: '#000', // Black for text and icons to ensure readability
        loaderColor: '#fff', // White for the loading indicator for visibility
        sliderColor: '#fff', // White slider for a clean look against the green background
        trackArtistColor: '#000', // Black for artist name to ensure it stands out
        trackNameColor: '#fff', // White for track name for visibility and contrast
    };
    

    return (
        <SpotifyPlayer
            token={spotifyToken}
            showSaveIcon
            callback={state => {
                if (!state.isPlaying) setPlay(false);
            }}
            play={play}
            uris={trackUri ? [trackUri] : []}
            styles={playerStyles}
        />
    );
}
