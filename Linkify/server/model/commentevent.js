const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commentevent', commentSchema);