import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import SpotifyWebApi from 'spotify-web-api-js';
import axios from 'axios';
import Dashboard from './Dashboard';
import Sidebar from './Sidebar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProfilePage from './ProfilePage'; // Assume you have this component
import FeedPage from './FeedPage'; // Assume you have this component
import FriendsPage from './FriendsPage'; // Assume you have this component
import './App.css';
const spotifyApi = new SpotifyWebApi();

const getTokenFromUrl = () => {
  return window.location.hash.substring(1).split('&').reduce((initial, item) => {
    let parts = item.split('=');
    initial[parts[0]] = decodeURIComponent(parts[1]);
    return initial;
  }, {});
};

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  const logout = () => {
    setUserProfile(null);
    setSpotifyToken("");
    setRefreshToken("");
    setLoggedIn(false);
  };

  useEffect(() => {
    const { access_token, refresh_token, expires_in } = getTokenFromUrl();
    window.location.hash = "";
    if (access_token) {
      setSpotifyToken(access_token);
      setRefreshToken(refresh_token);
      setExpiresIn(expires_in);
      spotifyApi.setAccessToken(access_token);
      spotifyApi.getMe().then((user) => {
        setUserProfile({
          displayName: user.display_name,
          email: user.email,
          profileImage: user.images[0]?.url || ''
        });
      });
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;
    const interval = setInterval(() => {
      axios.get('http://localhost:8888/refresh_token', {
        params: {
          refresh_token: refreshToken
        }
      }).then(response => {
        setSpotifyToken(response.data.access_token);
        spotifyApi.setAccessToken(response.data.access_token);
      }).catch(err => {
        console.error(err);
      });
    }, (expiresIn - 60) * 1000); // Refresh 1 minute before token expires

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  return (
    <Router>
      <div className="App" style={{ minHeight: "100vh", backgroundColor: "#282c34" }}>
        {!loggedIn ? (
          <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ marginBottom: "2rem", color: "#1DB954", fontSize: "3rem" }}>Harmonize</h1>
              <p style={{ marginBottom: "2rem", color: "white", maxWidth: "400px" }}>
                Your Spotify account will be used as an account on Harmonize.
              </p>
              <a className="btn btn-success btn-lg" href="http://localhost:8888/login">Login to Spotify</a>
            </div>
          </Container>
        ) : (
          <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: "#282c34" }}>
            <Sidebar userProfile={userProfile} onLogout={logout} />
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/" element={<FeedPage />} />
              <Route path="/friends" element={<FriendsPage />} />
            </Routes>
            <Dashboard spotifyApi={spotifyApi} spotifyToken={spotifyToken} />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
