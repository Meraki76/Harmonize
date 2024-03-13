/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios').default;
const crypto = require('crypto');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./models/User');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const mongoDB = process.env.MONGODB_URI;
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

mongoose.connect(mongoDB)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const generateRandomString = (length) => {
  return crypto
  .randomBytes(60)
  .toString('hex')
  .slice(0, length);
}

const stateKey = 'spotify_auth_state';

const app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-library-read user-library-modify user-read-playback-position user-read-recently-played user-top-read user-read-playback-state user-modify-playback-state user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', async function(req, res) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
      res.redirect('/#' +
          querystring.stringify({
              error: 'state_mismatch'
          }));
  } else {
      res.clearCookie(stateKey);
      const authOptions = {
          method: 'post',
          url: 'https://accounts.spotify.com/api/token',
          data: querystring.stringify({
              code: code,
              redirect_uri: redirect_uri,
              grant_type: 'authorization_code'
          }),
          headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
          }
      };

      try {
          const tokenResponse = await axios(authOptions);
          const body = tokenResponse.data;
          const access_token = body.access_token,
                refresh_token = body.refresh_token,
                expires_in = body.expires_in;

          const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
              headers: { 'Authorization': 'Bearer ' + access_token }
          });
          const userProfile = profileResponse.data;

          await User.findOneAndUpdate(
              { spotifyId: userProfile.id },
              {
                  spotifyId: userProfile.id,
                  displayName: userProfile.display_name,
                  email: userProfile.email,
                  spotifyUrl: userProfile.external_urls.spotify,
                  profileImage: userProfile.images.length > 0 ? userProfile.images[0].url : '',
                  country: userProfile.country
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          res.redirect('http://localhost:3000/#' +
              querystring.stringify({
                  access_token: access_token,
                  refresh_token: refresh_token,
                  expires_in: expires_in
              }));
      } catch (error) {
          console.error("Error during authentication:", error);
          res.redirect('/#' +
              querystring.stringify({
                  error: 'internal_error'
              }));
      }
  }
});

app.get('/refresh_token', async function(req, res) {
  const refresh_token = req.query.refresh_token;
  const authOptions = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    }
  };

  try {
    const response = await axios(authOptions);
    const body = response.data;
    res.send({
      'access_token': body.access_token,
      'refresh_token': body.refresh_token // Note: Spotify may not return a new refresh token
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).send('Internal Server Error');
  }
});

console.log('Listening on 8888');
app.listen(8888);
