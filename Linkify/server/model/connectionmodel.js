const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'connected'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes to ensure unique connections
connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);