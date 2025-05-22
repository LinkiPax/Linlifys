const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { 
    timestamps: true, // Adds `createdAt` and `updatedAt`
    indexes: [{ createdAt: 1 }] // Optional: index `createdAt` for faster querying
  }
);

module.exports = mongoose.model('Comment', commentSchema);
