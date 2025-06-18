const generateRoomId = require('../utils/idGenerators');
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
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      roomId: newRoom.roomId,
      iceServers: newRoom.iceServers,
      createdAt: newRoom.createdAt,
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
  const { meetingId: roomId, userId, username } = req.body;

  if (!roomId || !userId || !username) {
    return res.status(400).json({
      success: false,
      message: 'roomId, userId, and username are required',
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

    const userExists = room.users.some((user) => user.userId === userId);
    if (!userExists) {
      room.users.push({ userId, username });
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: userExists ? 'User rejoined the room' : 'Joined room successfully',
      users: room.users,
      iceServers: room.iceServers,
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

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    room.users = room.users.filter((user) => user.userId !== userId);
    if (room.users.length === 0) {
      room.isActive = false;
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Left room successfully',
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
        createdAt: room.createdAt,
        isActive: room.isActive,
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