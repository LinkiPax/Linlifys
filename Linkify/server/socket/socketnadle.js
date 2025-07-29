const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../model/messagemodel');
const Notification = require('../model/notificationschema');
const User = require('../model/usermodel');
const Room = require('../model/roommodel');
const mongoose = require('mongoose');
// Track connected users
const users = {};
const connectedUsers = new Map();
let ioInstance = null;
const initializeSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: ['https://localhost:5173', 'https://192.168.165.51:5173','https://10.206.136.51:5173'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // For Socket.IO v2/v3 compatibility
  });
 // Socket.IO Configuration


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
   
  socket.on('join-meeting', async ({ meetingId, userId, username }) => {
    try {
      socket.join(meetingId);
      
      const room = await Room.findOne({ roomId: meetingId });
      if (!room) {
        console.error(`Room ${meetingId} not found`);
        return;
      }

      // Update user with socket ID
      await Room.updateOne(
        { roomId: meetingId, 'users.userId': userId },
        { $set: { 'users.$.socketId': socket.id } }
      );

      // Get updated room data
      const updatedRoom = await Room.findOne({ roomId: meetingId });
      
      // Notify others in the room
      socket.to(meetingId).emit('user-joined', {
        id: userId,
        username,
        socketId: socket.id
      });

      // Send existing users to the new user
      const existingUsers = updatedRoom.users
        .filter(user => user.userId !== userId)
        .map(user => ({
          id: user.userId,
          username: user.username,
          socketId: user.socketId
        }));

      socket.emit('existing-users', existingUsers);

    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  });

  // Handle user leaving the room
  socket.on('leave-meeting', ({ meetingId, userId }) => { 
    socket.leave(meetingId);
    io.to(meetingId).emit('user-left', { id: userId });
  });

  // Handle meeting chat messages
  socket.on('send-message', ({ roomId, username, message }) => {
    io.to(roomId).emit('receive-message', { username, message });
  });

  // Enhanced signaling handling
  socket.on('signal', ({ to, from, signal }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('signal', { from, signal });
    } else {
      console.log(`Target socket ${to} not found`);
    }
  });

  // Enhanced ICE candidate handling
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('ice-candidate', { from: socket.id, candidate });
    }
  });

  // Handle screen sharing
  socket.on('start-screen-share', ({ roomId, userId }) => {
    socket.to(roomId).emit('screen-share-started', { userId });
  });

  socket.on('stop-screen-share', ({ roomId, userId }) => {
    socket.to(roomId).emit('screen-share-stopped', { userId });
  });

  // Map userId to socket.id
  socket.on('join', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    console.log("Incoming message data:", data);
    const {
      sender,
      receiver,
      senderId,
      receiverId,
      content,
      location,
      messageType,
      poll,
      event,
      deletedFor,
      contacts,
      image,
      isRead,
      video,
      audio
    } = data;
    try {
      const finalSender = senderId || sender;
      const finalReceiver = receiverId || receiver;
      console.log(`Sending message from ${sender} to ${receiver}`);
      console.log(`Sending message from ${senderId} to ${receiverId}`);
    // Create new Message instance
    const newMessage = new Message({
      sender: finalSender,
      receiver: finalReceiver,
      content: content || 'Message',
      location,
      messageType: messageType || 'text',
      poll: poll || { options: [] },
      event: event || { attendees: [] },
      deletedFor: deletedFor || [],
      contacts: contacts || [],
      image,
      isRead: isRead || false,
      video,
      audio
    });
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

  // Enhanced Notification System
  socket.on('send_notification', async (data) => {
    const { userId, title, message, type, priority, actionUrl, relatedEntity, relatedEntityModel } = data;
    try {
      const newNotification = new Notification({
        userId,
        title,
        message,
        type: type || 'system',
        priority: priority || 2,
        actionUrl,
        relatedEntity,
        relatedEntityModel,
        status: 'unread'
      });

      await newNotification.save();

      // Send notification to the receiver if connected
      if (users[userId]) {
        io.to(users[userId]).emit('new_notification', newNotification);
      } else {
        console.log(`User ${userId} is offline. Notification will be delivered later.`);
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      socket.emit('notification_error', { error: 'Failed to send notification' });
    }
  });

  // Notification status updates
  socket.on('mark_notification_read', async (notificationId) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { status: 'read', readAt: new Date() },
        { new: true }
      );
      socket.emit('notification_read', notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('notification_error', { error: 'Failed to mark notification as read' });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    try {
      // Find the room with this socket ID
      const room = await Room.findOne({ 'users.socketId': socket.id });
      if (room) {
        const user = room.users.find(u => u.socketId === socket.id);
        if (user) {
          // Notify others in the room
          io.to(room.roomId).emit('user-left', {
            id: user.userId,
            username: user.username
          });

          // Remove socket ID from user data
          await Room.updateOne(
            { roomId: room.roomId, 'users.userId': user.userId },
            { $unset: { 'users.$.socketId': '' } }
          );
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});
ioInstance = io;
  return io;
};
const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};

module.exports = {
  initializeSocket,
  getIO, 
  users,
  getConnectedUsers: () => connectedUsers,
  isUserOnline: (userId) => connectedUsers.has(userId.toString())
};