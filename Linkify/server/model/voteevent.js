const mongoose = require('mongoose');
const { Schema } = mongoose;

const voteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['up', 'down'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one vote per user per event
voteSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);