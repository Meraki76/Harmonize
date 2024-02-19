import React from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';
import { useState, useEffect } from "react";

export default function Player({ spotifyToken, trackUri }) {
    const [play, setPlay] = React.useState(false);

    useEffect (() => setPlay(true), [trackUri]);

    if (!spotifyToken) return null;
    return <SpotifyPlayer
        token={spotifyToken}
        showSaveIcon
        callback={state => {
            if (!state.isPlaying) setPlay(false);
        }}
        play={play}
        uris={trackUri ? [trackUri] : []}
    />
}