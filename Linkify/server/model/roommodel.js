const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  },
  isMicOn: {
    type: Boolean,
    default: false,
  },
  isVideoOn: {
    type: Boolean,
    default: false,
  },
  isScreenSharing: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const iceServerSchema = new mongoose.Schema({
  urls: {
    type: String,
    required: true,
  },
  username: String,
  credential: String,
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  users: [userSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  iceServers: [iceServerSchema],
});

// Add TTL index for automatic cleanup of inactive rooms
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

module.exports = mongoose.model('Room', roomSchema);