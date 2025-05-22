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
      enum: ["text", "audio", "location", "document", "poll", "event", "contact"], // <-- Make sure "contact" is included here
      default: "text",
    },
    content: {
      type: String,
    },
    audioURL: {
      type: String,
    },
    contacts: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId, // assuming contact ID is a Mongo ObjectId
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
      url: String,
      name: String,
      size: Number,
      type: String,
      thumbnail: String,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
