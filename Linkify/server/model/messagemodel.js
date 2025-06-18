const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "audio", "image", "video", "location", "document", "poll", "event", "contact"],
      default: "text",
    },
    content: {
      type: String,
    },
    // Audio message fields
    audio: {
      url: String,
      duration: Number,
      format: String,
      size: Number
    },
    // Image message fields
    image: {
      url: String,
      thumbnail: String, // smaller version for preview
      width: Number,
      height: Number,
      size: Number, // in bytes
      format: String, // e.g., "jpg", "png", etc.
      caption: String,
    },
    // Video message fields
    video: {
      url: String,
      thumbnail: String, // preview image
      duration: Number, // in seconds
      width: Number,
      height: Number,
      size: Number, // in bytes
      format: String, // e.g., "mp4", "mov", etc.
      caption: String,
    },
    contacts: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        avatar: String,
      }
    ],
    location: {
      latitude: Number,
      longitude: Number,
      duration: Number,
      live: Boolean,
      expiresAt: Date,
    },
    document: {
      url: { type: String },
      publicId: { type: String },
      name: { type: String },
      originalName: { type: String },
      size: { type: Number },
      type: { type: String},
      extension: { type: String},
    },
    poll: {
      question: String,
      options: [
        {
          text: String,
          voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      isMultiSelect: Boolean,
      totalVotes: Number,
      expiresAt: Date,
    },
    event: {
      title: String,
      description: String,
      date: Date,
      location: String,
      organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      attendees: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          status: { type: String, enum: ["going", "not_going", "maybe"] },
        },
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);