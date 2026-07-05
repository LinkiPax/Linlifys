const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../model/messagemodel');
const Notification = require('../model/notificationschema');
const User = require('../model/usermodel');
const Room = require('../model/roommodel');
const webPushService = require('../service/webPushService');
const mongoose = require('mongoose');
// Track connected users
const users = {};
const connectedUsers = new Map();
let ioInstance = null;
const initializeSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: [process.env.FRONTEND_ORIGIN],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // For Socket.IO v2/v3 compatibility
  });
 // Socket.IO Configuration


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
   
  socket.on('join-meeting', async ({ meetingId, userId, username, isMicOn, isVideoOn }) => {
    try {
      socket.join(meetingId);
      
      const room = await Room.findOne({ roomId: meetingId });
      if (!room) {
        console.error(`Room ${meetingId} not found`);
        return;
      }

      // Update user with socket ID and initial states
      await Room.updateOne(
        { roomId: meetingId, 'users.userId': userId },
        { 
          $set: { 
            'users.$.socketId': socket.id,
            'users.$.isMicOn': isMicOn ?? false,
            'users.$.isVideoOn': isVideoOn ?? true
          } 
        }
      );

      // Get updated room data
      const updatedRoom = await Room.findOne({ roomId: meetingId });
      
      // Notify others in the room
      socket.to(meetingId).emit('user-joined', {
        id: userId,
        username,
        socketId: socket.id,
        isMicOn: isMicOn ?? false,
        isVideoOn: isVideoOn ?? true
      });

      // Send existing users to the new user
      const existingUsers = updatedRoom.users
        .filter(user => user.userId !== userId)
        .map(user => ({
          id: user.userId,
          username: user.username,
          socketId: user.socketId,
          isMicOn: user.isMicOn,
          isVideoOn: user.isVideoOn
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
  socket.on('start-screen-share', async ({ roomId, userId }) => {
    try {
      await Room.updateOne(
        { roomId, 'users.userId': userId },
        { $set: { 'users.$.isScreenSharing': true } }
      );
      socket.to(roomId).emit('screen-share-started', { userId });
    } catch (err) {
      console.error('Error starting screen share:', err);
    }
  });

  socket.on('stop-screen-share', async ({ roomId, userId }) => {
    try {
      await Room.updateOne(
        { roomId, 'users.userId': userId },
        { $set: { 'users.$.isScreenSharing': false } }
      );
      socket.to(roomId).emit('screen-share-stopped', { userId });
    } catch (err) {
      console.error('Error stopping screen share:', err);
    }
  });

  // Handle user mic/video status update
  socket.on('user-status-update', async ({ roomId, userId, isMicOn, isVideoOn }) => {
    try {
      await Room.updateOne(
        { roomId, 'users.userId': userId },
        { $set: { 'users.$.isMicOn': isMicOn, 'users.$.isVideoOn': isVideoOn } }
      );
      socket.to(roomId).emit('user-status-update', { userId, isMicOn, isVideoOn });
    } catch (err) {
      console.error('Error updating user status:', err);
    }
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
      const recipientId = finalReceiver.toString();
      if (users[recipientId]) {
        io.to(users[recipientId]).emit('new_message', newMessage);
      } else {
        console.log(`User ${recipientId} is offline. Message will be delivered later.`);
      }

      const senderUser = await User.findById(finalSender).select('name username');
      const senderName = data.senderName || senderUser?.name || senderUser?.username || 'a contact';
      const actionUrl = `/messages/chat/${finalSender}`;
      const notification = await Notification.create({
        userId: recipientId,
        title: `New message from ${senderName}`,
        message: content || 'You have a new message',
        type: 'message',
        status: 'unread',
        actionUrl,
        sender: finalSender,
        relatedEntity: newMessage._id,
        relatedEntityModel: 'Message',
        priority: 1
      });

      if (users[recipientId]) {
        io.to(users[recipientId]).emit('new_notification', notification);
      }

      await webPushService.sendWebPushToUser(recipientId, {
        title: notification.title,
        body: notification.message,
        icon: '/Logo.png',
        badge: '/favicon.ico',
        tag: `message-${newMessage._id}`,
        url: actionUrl,
        data: {
          url: actionUrl,
          notificationId: notification._id.toString(),
          messageId: newMessage._id.toString(),
          senderId: finalSender.toString()
        }
      });
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

      await webPushService.sendWebPushToUser(userId, {
        title: newNotification.title || 'New notification',
        body: newNotification.message || 'You have a new notification',
        icon: '/Logo.png',
        badge: '/favicon.ico',
        tag: `notification-${newNotification._id}`,
        url: newNotification.actionUrl || '/notifications',
        data: {
          url: newNotification.actionUrl || '/notifications',
          notificationId: newNotification._id.toString()
        }
      });
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
    
    // Clean up users mapping
    for (const [uid, sid] of Object.entries(users)) {
      if (sid === socket.id) {
        delete users[uid];
        console.log(`Removed user mapping for offline user ${uid}`);
        break;
      }
    }
    
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

          // Remove the user completely from room users
          await Room.updateOne(
            { roomId: room.roomId },
            { $pull: { users: { userId: user.userId } } }
          );

          // If room has no users left, set isActive to false
          const updatedRoom = await Room.findOne({ roomId: room.roomId });
          if (updatedRoom && updatedRoom.users.length === 0) {
            await Room.updateOne(
              { roomId: room.roomId },
              { $set: { isActive: false } }
            );
          }
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
