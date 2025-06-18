const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  users: [{
    userId: String,
    username: String,
    socketId: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  iceServers: [{
    urls: String,
  }],
});

module.exports = mongoose.model('Room', roomSchema);