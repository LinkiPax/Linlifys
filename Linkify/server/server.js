require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');//for database
const cors = require('cors');//for security
const helmet = require('helmet');//for security
const morgan = require('morgan');// for easy debugging 
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');// it is used for real time communication for clients
const { ApolloServer } = require("apollo-server-express");
const { typeDefs, resolvers } = require("./GraphQL/messageschema");
const Message = require('./model/messagemodel');
// Import Routes
const userRoutes = require('./routes/userroutes');
const postRoutes = require('./routes/Postroutes');
const commentRoutes = require('./routes/Commentroutes');
const usersRoutes = require('./routes/UsersRoutes');
const suggest = require('./routes/suggestroute');
const trendingTopicRoutes = require('./routes/Trendingroute');
const userDetailsRoutes = require('./routes/userDetails');
const educationRoutes = require('./routes/educationRoutes');
const openAISuggestionRoutes = require('./routes/openaisuggestroutes');
const trendingRoutes = require('./routes/externalapitrendingRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const profileViewRoutes = require('./routes/Profileviewroute');
const postImpressionRoutes = require('./routes/PostImpressionroutes');
const skillRoutes = require('./routes/skillroute');
const messageRoutes = require('./routes/messageroute');
const notificationRoutes = require('./routes/notificationroute');
const { exec } = require('child_process');
const resumeRoutes = require('./routes/Resumeroute'); 
const path = require('path');
const {initializeSocket} = require('./socket/socketnadle');
const rooms=require('./routes/roomRoute')
const status=require('./routes/statusroutes') 
const statusedit=require('./routes/statusedit')
const short = require('./routes/shortRoutes') 
const connection = require('./routes/connectionroute')
const eventRoutes = require('./routes/Eventroute');
// Initialize App and HTTP Server    
const app = express();

const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Allow requests from frontend
    methods: ['GET', 'POST','PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow cookies and credentials
  },
}); 

 
// Middleware for CORS
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH', 'OPTIONS'],
  credentials: true // Allow cookies and credentials
}));

// Handle Preflight Requests
app.options('*', cors());
// Other Middleware
app.use(express.json());
// app.use(helmet());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('tiny'));
app.use(cookieParser());
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res, path, stat) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    },
  })
);

//  
// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Linkipax', {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit process on connection failure
  } 
};

connectDB();

// Socket.IO Configuration
let users = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
   
    // Handle user joining a meeting room
    socket.on('join-meeting', ({ meetingId, username, userId }) => {
      socket.join(meetingId);
      console.log(`${username} joined meeting ${meetingId}`);
      io.to(meetingId).emit('user-joined', { id: socket.id, username, userId });
    });
    // Handle user leaving the room
  socket.on('leave-meeting', ({ meetingId }) => { 
    socket.leave(meetingId);
    io.to(meetingId).emit('user-left', { id: socket.id });
  });
  // Handle meeting chat messages
  socket.on('send-message', ({ meetingId, username, message }) => {
    io.to(meetingId).emit('receive-message', { username, message });
  });
  // Map userId to socket.id
  socket.on('join', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
  });
// Handle incoming messages
  socket.on('send_message', async (data) => {
    console.log("Incoming message data:", data);
    const { senderId, receiverId, content,location,
      messageType, poll,event,deletedFor,contacts} = data;
    try {
      const newMessage = new Message({ sender: senderId, receiver: receiverId, content,location ,messageType, poll,event,deletedFor,contacts});
      await newMessage.save();

      // Acknowledge the sender
      socket.emit('message_sent', newMessage);

      // Deliver the message to the receiver if connected
      if (users[receiverId]) {
        io.to(users[receiverId]).emit('new_message', newMessage);
      } else {
        console.log(`User ${receiverId} is offline. Message will be delivered later.`);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });
 // Notification System
 socket.on('send_notification', async (data) => {
  const { senderId, receiverId, type, message } = data;
  try {
    const newNotification = new Notification({ sender: senderId, receiver: receiverId, type, message });
    await newNotification.save();

    // Send notification to the receiver if connected
    if (users[receiverId]) {
      io.to(users[receiverId]).emit('new_notification', newNotification);
    } else {
      console.log(`User ${receiverId} is offline. Notification will be delivered later.`);
    }
  } catch (error) {
    console.error('Error saving notification:', error);
    socket.emit('notification_error', { error: 'Failed to send notification' });
  }
});
  socket.on('disconnect', () => {
    console.log(`Client with socket ID ${socket.id} disconnected`);
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});


// GraphQL Setup
const apolloServer = new ApolloServer({ typeDefs, resolvers });
const startApolloServer = async () => {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
};
startApolloServer();
// Export io to be used in other parts of your app (like routes)
module.exports = { io };

app.use('/user', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user/suggestions', suggest);
app.use('/api/trending-topics', trendingTopicRoutes);
app.use('/api/events', eventRoutes);
app.use('/profile', userDetailsRoutes);
app.use('/openai', openAISuggestionRoutes);
app.use('/external', trendingRoutes);
app.use('/experience', experienceRoutes);
app.use('/education', educationRoutes); 
app.use('/profile-view', profileViewRoutes);
app.use('/post-impression', postImpressionRoutes);//PostImpression
app.use('/skill', skillRoutes);
app.use('/', messageRoutes);//message
app.use('/notification', notificationRoutes);
app.use('/upload', resumeRoutes);
app.use('/room',rooms);
app.use('/',status)
app.use('/api/status',statusedit) 
app.use('/api/short', short)
app.use("/connections", connection); //connection
app.use('/api/groups', require('./routes/grouproute'));//group
// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');       
});
app.set('io', io);
// 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` }); 
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
}); 

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('Server is shutting down...');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
initializeSocket(io);
// Start Server
const port = process.env.PORT || 5000;
server.listen(port, () => { 
  console.log(`Server running on http://localhost:${port}`);
});
