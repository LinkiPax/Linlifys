const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  backgroundImage: {
    public_id: { type: String, required: true },
    secure_url: { type: String, required: true }
  },

  socialLinks: {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true },
    youtube: { type: String, trim: true },
    medium: { type: String, trim: true },
    other: { type: String, trim: true }
  },

  interests: { type: [String], default: [] },
  location: { type: String, trim: true },
  occupation: { type: String, trim: true },
  achievements: { type: [String], default: [] },
  hobbies: { type: [String], default: [] }

}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model("UserDetails", userDetailsSchema);
