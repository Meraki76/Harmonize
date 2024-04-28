// Environment configuration for secure handling of credentials and URIs
require('dotenv').config();

// Core dependencies for server setup and API management
const express = require('express');
const axios = require('axios').default; // For making HTTP requests to external APIs, like Spotify
const crypto = require('crypto'); // For generating cryptographically strong random strings
const cors = require('cors'); // To enable CORS for cross-origin requests
const querystring = require('querystring'); // For URL query string manipulation
const cookieParser = require('cookie-parser'); // To parse cookies attached to the client request object
const mongoose = require('mongoose'); // MongoDB framework for handling schemas and models

// Import User and Conversation models to interact with the MongoDB database
const User = require('./models/User');
const Conversation = require('./models/Conversation');

// Import routes for handling requests for posts and users
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const mongoDB = process.env.MONGODB_URI;
const redirect_uri = 'http://localhost:8888/callback'; 

// Server initialization
const app = express();
const stateKey = 'spotify_auth_state'; // Key for managing OAuth2 state parameter
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
      origin: "http://localhost:3000", // Client-side URL for CORS policy
      methods: ["GET", "POST"],
      credentials: true
  }
});

// Middleware setup
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser())
   .use(express.json()) 
   .use(express.urlencoded({ extended: true })); 

app.use(cors({
    origin: 'http://localhost:3000', // This allows only your client's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
  }));

// Use routes for posts and users
app.use('/posts', postRoutes);
app.use('/users', userRoutes);

// MongoDB connection
mongoose.connect(mongoDB)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Function to generate a random state string for OAuth2 authentication
const generateRandomString = (length) => {
  return crypto
  .randomBytes(60)
  .toString('hex')
  .slice(0, length);
}

// Redirect user for Spotify login and handle the authorization callback
app.get('/login', function(req, res) {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // Define scopes needed from Spotify
  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-library-read user-library-modify user-read-playback-position user-read-recently-played user-top-read user-read-playback-state user-modify-playback-state user-read-currently-playing';
  // Redirect to Spotify's authorization page
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope, 
      redirect_uri: redirect_uri,
      state: state
    }));
});

// Callback route from Spotify OAuth
app.get('/callback', async function(req, res) {
  // Extract the authorization code and state from the request query parameters
  const code = req.query.code || null;
  const state = req.query.state || null;

  // Retrieve the stored state from cookies if available
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  // Check if the state is null or does not match the stored state
  if (state === null || state !== storedState) {
      // If there's a state mismatch, redirect the user to an error page with an appropriate message
      res.redirect('/#' +
          querystring.stringify({
              error: 'state_mismatch'
          }));
  } else {
      // If the state is valid, clear the stored state cookie
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

          // Fetch user profile from Spotify
          const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
              headers: { 'Authorization': 'Bearer ' + access_token }
          });
          const userProfile = profileResponse.data;
          
          // Upsert user into the database
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
          
          // query to find _id by spotifyId
          const foundUser = await User.findOne({ spotifyId: userProfile.id });
          console.log(foundUser._id);

          res.redirect('http://localhost:3000/#' +
              querystring.stringify({
                  access_token: access_token,
                  refresh_token: refresh_token,
                  expires_in: expires_in,
                  userId: foundUser._id.toString()
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

// Refresh token route
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
      'refresh_token': body.refresh_token 
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Start or retrieve a conversation between two users
app.post('/api/conversations/start', async (req, res) => {
  const { currentUserId, otherUserId } = req.body;
  try {
      let conversation = await Conversation.findOne({
          participants: { $all: [currentUserId, otherUserId] }
      });

      if (!conversation) {
          conversation = new Conversation({
              participants: [currentUserId, otherUserId],
              messages: [] // Starting with no messages
          });
          await conversation.save();
      }

      res.json(conversation);
  } catch (error) {
      console.error('Failed to start or retrieve conversation:', error);
      res.status(500).json({ message: 'Failed to start or retrieve conversation' });
  }
});

// Fetch a conversation by its ID
app.get('/api/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  try {
      const conversation = await Conversation.findById(conversationId)
          .populate('participants', 'displayName profileImage');  

      if (!conversation) {
          return res.status(404).send({ message: "Conversation not found" });
      }

      res.json(conversation);
  } catch (error) {
      console.error('Failed to fetch the conversation:', error);
      res.status(500).send({ message: 'Failed to retrieve the conversation' });
  }
});

// Fetch all conversations for a user
app.get('/api/conversations/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
      const conversations = await Conversation.find({ participants: userId })
          .populate('participants', 'displayName profileImage'); // Populates data for each participant

      const modifiedConversations = conversations.map(conversation => {
          const otherParticipant = conversation.participants.find(participant => participant._id.toString() !== userId);
          return {
              ...conversation._doc,
              otherParticipantDisplayName: otherParticipant.displayName,
              otherParticipantProfileImage: otherParticipant.profileImage || 'https://via.placeholder.com/150',
          };
      });

      res.json(modifiedConversations);
  } catch (error) {
      console.error('Failed to fetch conversations:', error);
      res.status(500).send({ message: 'Failed to retrieve conversations' });
  }
});

// Follow a user
app.post('/users/:id/follow', async (req, res) => {
  const { id } = req.params; // the user to be followed
  const { userId } = req.body; // the user who wants to follow

  if (userId === id) {
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  try {
    // Attempt to update both users atomically
    const userToFollow = await User.findByIdAndUpdate(id, {
      $addToSet: { followers: userId } // Only adds userId if it's not already present
    }, { new: true });

    const followingUser = await User.findByIdAndUpdate(userId, {
      $addToSet: { following: id } // Only adds id if it's not already present
    }, { new: true });

    if (!userToFollow || !followingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: "Error following user", error });
  }
});

// Unfollow a user
app.post('/users/:id/unfollow', async (req, res) => {
  const { id } = req.params; // the user to be unfollowed
  const { userId } = req.body; // the user who wants to unfollow

  if (userId === id) {
    return res.status(400).json({ message: "You cannot unfollow yourself." });
  }

  try {
    // Update the 'user to be unfollowed' by pulling the current user from their followers list
    const userToUnfollow = await User.findByIdAndUpdate(id, {
      $pull: { followers: userId }
    }, { new: true });

    // Update the 'current user' by pulling the unfollowed user from their following list
    const unfollowingUser = await User.findByIdAndUpdate(userId, {
      $pull: { following: id }
    }, { new: true });

    if (!userToUnfollow || !unfollowingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: "Error unfollowing user", error });
  }
});

const users = {}; // Maps userId to socketId

// Socket.IO connection for real-time messaging
io.on('connection', socket => {
    console.log('User connected:', socket.id);

    socket.on('register', userId => {
        users[userId] = socket.id;
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('sendMessage', async ({ senderId, senderDisplayName, text, conversationId }) => {
      try {
          const conversation = await Conversation.findById(conversationId);
          if (!conversation) {
              console.error('Conversation not found');
              return;
          }
  
          // Check if both sender and receiver are part of the conversation
          const isSenderInConversation = conversation.participants.some(p => p.toString() === senderId);
          const isReceiverInConversation = conversation.participants.some(p => p.toString() !== senderId);
          if (!isSenderInConversation || !isReceiverInConversation) {
              console.error('Sender or receiver is not part of the conversation');
              return;
          }
  
          const receiverId = conversation.participants.find(p => p.toString() !== senderId).toString();
          const message = {
              sender: senderId,
              senderDisplayName: senderDisplayName,
              text,
              createdAt: new Date(),
              conversationId
          };
          conversation.messages.push(message);
          await conversation.save();
  
          // Emit to the sender's socket for real-time update
          socket.emit('messageSent', message);
  
          // Check if the receiver is connected and emit the message
          const receiverSocketId = users[receiverId];
          if (receiverSocketId) {
              io.to(receiverSocketId).emit('receiveMessage', message);
              console.log('Message sent to receiver');
          } else {
              console.log('Receiver is not connected');
          }
      } catch (error) {
          console.error('Error sending message:', error);
      }
  });

    socket.on('disconnect', () => {
        const userId = Object.keys(users).find(key => users[key] === socket.id);
        if (userId) {
            delete users[userId];
            console.log(`User ${userId} disconnected and deregistered`);
        }
    });
});

console.log('Listening on 8888');
server.listen(8888, () => console.log('Server and Socket.IO listening on 8888'));

