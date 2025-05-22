const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Profile picture path or URL
    profilePicture: {
      type: String,
      trim: true,
      required: false,
      // Optional basic validator: allow Cloudinary URLs or relative/local paths
      validate: {
        validator: (val) =>
          !val || /^https?:\/\/.+/.test(val) || /^\/?uploads\/.+/.test(val),
        message: 'Invalid profile picture path or URL',
      },
    },

    // Optional field to track where the image is stored
    storageType: {
      type: String,
      enum: ['cloudinary', 'local'],
      default: 'cloudinary',
    },

    bio: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    company: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strictPopulate: false,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
