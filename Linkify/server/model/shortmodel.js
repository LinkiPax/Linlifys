const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const shortSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  videoUrl: { type: String, required: true },
  caption: String,
  createdAt: { type: Date, default: Date.now },

  // New Features 👇
  likes: [{ type: String }],         // Array of userIds who liked
  dislikes: [{ type: String }],      // Array of userIds who disliked
  comments: [commentSchema],         // Embedded comments
  shareCount: { type: Number, default: 0 }, // Optional count
});

module.exports = mongoose.model("Short", shortSchema);
