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
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const Conversation = require('./models/Conversation');
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const mongoDB = process.env.MONGODB_URI;
const redirect_uri = 'http://localhost:8888/callback'; 



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
   .use(cookieParser())
   .use(express.json()) 
   .use(express.urlencoded({ extended: true })); 

app.use('/posts', postRoutes);
app.use('/users', userRoutes);

app.use(cors({
  origin: 'http://localhost:3000', // This allows only your client's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Optional: specify methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Optional: specify headers
}));

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

// Server-side: Add this endpoint in your server setup
// Server-side: Modify your endpoint to use passed user IDs
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



const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
      origin: "http://localhost:3000", // Allow only your client's origin
      methods: ["GET", "POST"], // Optional: specify allowed methods
      credentials: true // Optional: if credentials need to be sent
  }
});


const users = {}; // Maps userId to socketId

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

