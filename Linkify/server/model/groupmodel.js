const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  image: { 
    type: String,
    default: '/default-group.png'
  },
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ name: 'text' });
groupSchema.index({ members: 1 });

module.exports = mongoose.model('Group', groupSchema);