const Room = require('../model/roommodel');
const { v4: uuidv4 } = require('uuid');

const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();
    const newRoom = await Room.create({
      roomId,
      users: [],
      isActive: true,
      createdAt: new Date(),
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        // Add TURN servers if available for better connectivity
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        roomId: newRoom.roomId,
        iceServers: newRoom.iceServers,
        createdAt: newRoom.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message,
    });
  }
};

const joinRoom = async (req, res) => {
  const { meetingId: roomId, userId, username, socketId, isMicOn = true, isVideoOn = true } = req.body;


  if (!roomId || !userId || !username || !socketId) {
    return res.status(400).json({
      success: false,
      message: 'roomId, userId, username, and socketId are required',
    });
  }

  try {
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This room is no longer active',
      });
    }

    // Update existing user or add new user
    const userIndex = room.users.findIndex(user => user.userId === userId);
    if (userIndex >= 0) {
      // Update socketId if user rejoins
      room.users[userIndex].socketId = socketId;
    } else {
      room.users.push({ userId, username, socketId });
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      room: {
        roomId: room.roomId,
        users: room.users.filter(u => u.userId !== userId), // Don't return self
        iceServers: room.iceServers,
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining room',
      error: error.message,
    });
  }
};

const leaveRoom = async (req, res) => {
  const { roomId, userId } = req.body;

  if (!roomId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'roomId and userId are required',
    });
  }

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    room.users = room.users.filter(user => user.userId !== userId);
    
    // Deactivate room if empty
    if (room.users.length === 0) {
      room.isActive = false;
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Left room successfully',
      remainingUsers: room.users.length,
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving room',
      error: error.message,
    });
  }
};

const getRoomInfo = async (req, res) => {
  const { roomId } = req.params;

  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: 'roomId is required',
    });
  }

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    res.status(200).json({
      success: true,
      room: {
        roomId: room.roomId,
        users: room.users,
        isActive: room.isActive,
        createdAt: room.createdAt,
        iceServers: room.iceServers,
      },
    });
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting room info',
      error: error.message,
    });
  }
};

module.exports = { createRoom, joinRoom, leaveRoom, getRoomInfo };