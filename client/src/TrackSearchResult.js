import React from 'react';

export default function TrackSearchResult({ track, chooseTrack }) {
    // This function is triggered when the track result is clicked. It calls the chooseTrack function with the current track.
    function handlePlay() {
        chooseTrack(track);
    }

    // Render the track search result as an interactive list item.
    return (
        // The container is styled to behave as a clickable item. 
        <div className="d-flex m-2 align-items-center" style={{ cursor: "pointer" }} onClick={handlePlay}>
            {/* The track's album art is displayed with fixed dimensions to maintain uniformity across all search results. */}
            <img 
                src={track.albumUrl} 
                style={{ height: '64px', width: '64px' }} 
                alt={`Album art for ${track.title}`} 
            />
            {/* Container for the track details, positioned with a margin to the left of the image for clear separation. */}
            <div className="ml-3">
                {/* The track title is displayed prominently. */}
                <div>{track.title}</div>
                {/* The artist's name is displayed below the title in a muted text style to differentiate it visually. */}
                <div className="text-muted">{track.artist}</div>
            </div>
        </div>
    );
}
