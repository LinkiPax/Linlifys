const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  skills: { type: [String], default: [] },
  industry: { type: String, required: true },
  connections: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      requestedAt: { type: Date, default: Date.now },
    },
  ],
  connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  strictPopulate: false, // Allow population of fields not in schema
});

// Ensure the model is not being redefined
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
  