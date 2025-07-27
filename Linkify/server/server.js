
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const https = require('https');
const { ApolloServer } = require("apollo-server-express");
const { typeDefs, resolvers } = require("./GraphQL/messageschema");
const path = require('path');
const { initializeSocket } = require('./socket/socketnadle'); // New socket handler
const fs = require('fs');

const options = {
  key: fs.readFileSync('./localhost+1-key.pem'),
  cert: fs.readFileSync('./localhost+1.pem'),
  requestCert: false,
  rejectUnauthorized: false // For development only!
}; 
// Initialize Express app and HTTP server 
const app = express();
const server = https.createServer(options,app);

// Middleware Setup
app.use(cors({ 
  origin: ['https://localhost:5173', 'https://192.168.165.51:5173', 'https://192.168.137.51:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true      
}));
app.options('*', cors());

app.use(express.json()); 
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); 
app.use(morgan('tiny'));
app.use(cookieParser());
app.use("/uploads", express.static("uploads", { 
  setHeaders: (res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
}));

// MongoDB Connection
const connectDB = async () => {
  try { 
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Linkipax');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Initialize Socket.IO 
initializeSocket(server);

// Apollo GraphQL Setup
const apolloServer = new ApolloServer({ typeDefs, resolvers });
const startApolloServer = async () => {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
};
startApolloServer();

// Routes 
app.use('/user', require('./routes/userroutes'));
app.use('/api/posts', require('./routes/Postroutes'));
app.use('/api/comments', require('./routes/Commentroutes'));
app.use('/api/users', require('./routes/UsersRoutes'));
app.use('/api/user/suggestions', require('./routes/suggestroute'));
app.use('/api/trending-topics', require('./routes/Trendingroute'));
app.use('/api/events', require('./routes/Eventroute'));
app.use('/profile', require('./routes/userDetails'));
app.use('/experience', require('./routes/experienceRoutes'));
app.use('/education', require('./routes/educationRoutes'));
app.use('/openai', require('./routes/openaisuggestroutes'));
app.use('/external', require('./routes/externalapitrendingRoutes'));
app.use('/profile-view', require('./routes/Profileviewroute'));
app.use('/post-impression', require('./routes/PostImpressionroutes'));
app.use('/skill', require('./routes/skillroute'));
app.use('/', require('./routes/messageroute'));
app.use('/api/notifications', require('./routes/notificationroute'));
app.use('/upload', require('./routes/Resumeroute'));
app.use('/api/room', require('./routes/roomRoute'));   
app.use('/', require('./routes/statusroutes'));
app.use('/api/status', require('./routes/statusedit'));
app.use('/api/short', require('./routes/shortRoutes'));
app.use("/connections", require('./routes/connectionroute'));
app.use('/api/groups', require('./routes/grouproute'));
app.use('/jpbs', require('./routes/Jobsroutes'));
// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// 404 Handler
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
  console.log('Graceful shutdown initiated...');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
 

// Start Server
const port = process.env.PORT || 5000;

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at https://0.0.0.0:${port}`);
});
    