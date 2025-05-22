const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String },
  username: { type: String, required: true },
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [UserSchema],
});

module.exports = mongoose.model('Room', RoomSchema);
