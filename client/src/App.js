import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import SpotifyWebApi from 'spotify-web-api-js';
import axios from 'axios';
import Dashboard from './Dashboard';

const spotifyApi = new SpotifyWebApi();

const getTokenFromUrl = () => {
  return window.location.hash.substring(1).split('&').reduce((initial, item) => {
    let parts = item.split('=');
    initial[parts[0]] = decodeURIComponent(parts[1]);
    return initial
  }, {});
}

function App() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [nowPlaying, setNowPlaying] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const spotifyToken = getTokenFromUrl().access_token;
    const refreshToken = getTokenFromUrl().refresh_token;
    const expiresIn = getTokenFromUrl().expires_in;
    window.location.hash = "";
    console.log("This is our spotify token: ", spotifyToken);
    console.log("This is our refresh token: ", refreshToken);
    console.log("This is the expiresIn: ", expiresIn);

    if (spotifyToken) {
      setSpotifyToken(spotifyToken);
      setRefreshToken(refreshToken);
      setExpiresIn(expiresIn);
      spotifyApi.setAccessToken(spotifyToken);
      spotifyApi.getMe().then((user) => {
        console.log(user);
      });
      setLoggedIn(true);
    }
  })

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;
    console.log("Setting up interval to refresh token");
    const interval = setInterval(() => {
      console.log("Refreshing token");
      axios.get('http://localhost:8888/refresh_token', {
        params: {
          refresh_token: refreshToken
        }
      })
      .then(response => {
        const { access_token } = response.data;
        console.log(`Token refreshed: ${access_token}`); // Log the new token
        setSpotifyToken(access_token);
        spotifyApi.setAccessToken(access_token);
      })
      .catch(err => {
        console.error(err);
        // Handle error, e.g., by logging out the user
      });
    }, (expiresIn - 60) * 1000); // Refresh 1 minute before token expires

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [refreshToken, expiresIn]); // This effect runs when refreshToken or expiresIn changes

  const getNowPlaying = () => {
    spotifyApi.getMyCurrentPlaybackState()
      .then((response) => {
        console.log("Got response: ", response);
        setNowPlaying({
          name: response.item.name,
          albumArt: response.item.album.images[0].url})
      }).catch((err) => {
        console.log("Error getting current playback state: ", err);
        setNowPlaying({
          name: "No song playing",
          albumArt: ""
        })
      })
  }

//   spotifyApi.getMe().then(data => {
//     console.log("fart");
//     console.log(data);
//     // This logs the user's profile data. You can infer from this that the token is valid.
//     // However, this doesn't explicitly list the scopes.
// }).catch(err => {
//     console.error(err);
//     // Handle errors (e.g., token might be invalid or expired)
// });


  return (
    <div className="App">
      {!loggedIn && <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <a className="btn btn-success btn-lg" href="http://localhost:8888/login">Login to spotify</a>
        </Container>}
      {loggedIn && (
        <>
          <Dashboard spotifyApi={spotifyApi} spotifyToken={spotifyToken} />
          <div>Now Playing: {nowPlaying.name}</div>
          <div>
            <img src={nowPlaying.albumArt} style={{ height: 150 }} />
          </div>
        </>
      )}
      {loggedIn && (
        <button onClick={() => getNowPlaying()}>
          Check Now Playing
        </button>
      )}
    </div>
  );
}

export default App;
