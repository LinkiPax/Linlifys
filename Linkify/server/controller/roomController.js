const Room = require('../model/roommodel');
const generateRoomId = require('../utils/idGenerators');

// Create a new room
const createRoom = async (req, res) => {   
  try {
    const roomId = generateRoomId();
    const newRoom = await Room.create({ roomId, users: [] });
    res.status(201).json({ 
      success: true,
      message: 'Room created successfully',  
      roomId 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating room', 
      error: error.message 
    });
  }
};

// Join a room
const joinRoom = async (req, res) => {
  const { meetingId: roomId, userId, username } = req.body;

  console.log(req.body);
  // Validate input 
  if (!roomId || !userId || !username) {
    return res.status(400).json({ 
      success: false,
      message: 'roomId, userId, and username are required' 
    });
  }

  try { 
    const room = await Room.findOne({ roomId }); 

    // Check if room exists
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }

    // Check if user already exists in the room
    const userExists = room.users.some(user => user.userId === userId);
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already in the room' 
      });
    }

    // Add user to room
    room.users.push({ userId, username });
    await room.save();

    res.status(200).json({ 
      success: true,
      message: 'Joined room successfully', 
      users: room.users 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error joining room', 
      error: error.message 
    });
  }
};

module.exports = { createRoom, joinRoom };
