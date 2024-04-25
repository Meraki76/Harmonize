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
        activeColor: '#fff', 
        bgColor: '#1DB954', 
        color: '#000', 
        loaderColor: '#fff', 
        sliderColor: '#fff', 
        trackArtistColor: '#000',
        trackNameColor: '#fff', 
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
