const Room = require('../model/roommodel');
const Message = require('../model/messagemodel'); // Assuming you have a Message model
const mongoose = require('mongoose');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Track which rooms each socket is in
    const userRooms = new Set();

    // Join room
    socket.on('joinRoom', async ({ roomId, userId, username }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error('Invalid user ID format');
        }

        const room = await Room.findOne({ roomId });
        if (!room) {
          throw new Error('Room not found');
        }

        // Check if user already in room
        const userExists = room.users.some(user => user.userId.equals(userId));
        if (!userExists) {
          room.users.push({ userId, username });
          await room.save();
        }

        socket.join(roomId);
        userRooms.add(roomId);
        io.to(roomId).emit('userJoined', { 
          userId, 
          username, 
          users: room.users.map(u => ({
            userId: u.userId,
            username: u.username
          }))
        });
        console.log(`${username} joined ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('roomError', { message: error.message });
      }
    });

    // Send a message (supports text and location)
    socket.on('sendMessage', async ({ roomId, userId, message, messageType = 'text', location }) => {
      try {
        // Validate room membership
        if (!userRooms.has(roomId)) {
          throw new Error('Not in this room');
        }

        // Prepare message data
        const messageData = {
          room: roomId,
          sender: userId,
          content: message,
          messageType
        };

        // Handle location messages
        if (messageType === 'location' && location) {
          messageData.location = {
            coordinates: [location.longitude, location.latitude],
            duration: location.duration,
            live: location.live || false,
            expiresAt: new Date(location.expiresAt)
          };
        }

        // Create and save message
        const newMessage = new Message(messageData);
        await newMessage.save();

        // Populate sender info
        await newMessage.populate('sender', 'username avatar');

        // Broadcast to room
        io.to(roomId).emit('newMessage', {
          _id: newMessage._id,
          sender: newMessage.sender,
          content: newMessage.content,
          messageType: newMessage.messageType,
          location: newMessage.location,
          createdAt: newMessage.createdAt
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('messageError', { 
          message: 'Failed to send message',
          error: error.message
        });
      }
    });

    // Leave room
    socket.on('leaveRoom', async ({ roomId, userId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) {
          throw new Error('Room not found');
        }

        // Remove user from room
        room.users = room.users.filter(user => !user.userId.equals(userId));
        await room.save();

        socket.leave(roomId);
        userRooms.delete(roomId);
        io.to(roomId).emit('userLeft', { 
          userId, 
          users: room.users.map(u => ({
            userId: u.userId,
            username: u.username
          }))
        });
        console.log(`${userId} left ${roomId}`);
      } catch (error) {
        console.error('Leave room error:', error);
        socket.emit('roomError', { message: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Leave all rooms on disconnect
        for (const roomId of userRooms) {
          const room = await Room.findOne({ roomId });
          if (room) {
            // Find by socket ID or other identifier
            room.users = room.users.filter(user => user.socketId !== socket.id);
            await room.save();
            io.to(roomId).emit('userLeft', { userId: socket.id, users: room.users });
          }
        }
        console.log(`Disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Disconnect cleanup error:', error);
      }
    });
  });
};

module.exports = { initializeSocket };