// Import necessary modules and components from React, Bootstrap, Spotify API, Axios, and local files.
import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import SpotifyWebApi from 'spotify-web-api-js';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import custom components that define different pages and UI parts.
import Dashboard from './Dashboard';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import ProfilePage from './ProfilePage';
import FeedPage from './FeedPage';
import FriendsPage from './FriendsPage';
import ChatRoom from './ChatRoom';

// Context for sharing search functionality across components.
import { SearchProvider } from './SearchContext';

// Import global styles for the app.
import './App.css';

// Initialize Spotify API handler.
const spotifyApi = new SpotifyWebApi();

// Function to extract the Spotify token from URL hash. Used during initial login.
const getTokenFromUrl = () => {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
      let parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

function App() {
  // State hooks for user profile, Spotify token, refresh token, expiry time, and login status.
  const [userProfile, setUserProfile] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  // Logout function to clear user-related state.
  const logout = () => {
    setUserProfile(null);
    setSpotifyToken("");
    setRefreshToken("");
    setLoggedIn(false);
  };

  // Effect hook to handle authentication and fetching user data from Spotify.
  useEffect(() => {
    const { access_token, refresh_token, expires_in, userId } = getTokenFromUrl();
    window.history.pushState({}, document.title, "/");
    if (access_token) {
      setSpotifyToken(access_token);
      setRefreshToken(refresh_token);
      setExpiresIn(expires_in);
      spotifyApi.setAccessToken(access_token);

      // Fetch user profile from Spotify and update state.
      spotifyApi.getMe().then((user) => {
        setUserProfile({
          userId: userId,
          spotifyId: user.id,
          displayName: user.display_name,
          email: user.email,
          profileImage: user.images[0]?.url || ''
        });
      });
      setLoggedIn(true);
    }
  }, []);

  // Effect hook to handle automatic token refresh.
  useEffect(() => {
    if (!refreshToken || !expiresIn) return;
    const interval = setInterval(() => {
      axios.get('http://localhost:8888/refresh_token', {
        params: { refresh_token: refreshToken }
      }).then(response => {
        setSpotifyToken(response.data.access_token);
        spotifyApi.setAccessToken(response.data.access_token);
      }).catch(err => {
        console.error(err);
      });
    }, (expiresIn - 60) * 1000);  // Refresh token 1 minute before expiry.

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  // Render the main app structure with routes and layout.
  return (
    <Router>
      <div className="App" style={{ minHeight: "100vh", backgroundColor: "#282c34" }}>
        {!loggedIn ? (
          // Display a login screen if not logged in.
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
          // Main app interface if logged in.
          <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: "#282c34" }}>
            <Sidebar userProfile={userProfile} onLogout={logout} />
            <SearchProvider>
              <SearchBar />
              <Routes>
                <Route path="/profile/:displayName" element={<ProfilePage userProfile={userProfile} />} />
                <Route path="/" element={<FeedPage userProfile={userProfile} />} />
                <Route path="/friends" element={<FriendsPage userProfile={userProfile} />} />
                <Route path="/chat/:conversationId" element={<ChatRoom userProfile={userProfile} />} />
              </Routes>
            </SearchProvider>
            <Dashboard spotifyApi={spotifyApi} spotifyToken={spotifyToken} />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
