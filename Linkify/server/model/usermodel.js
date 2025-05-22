const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const { createTokenuser } = require('../service/authentication1');
const mongoose = require("mongoose");

const userSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    trim: true 
  },
  password: {
    type: String,
    required: true,
    minlength: 8
    // Removed direct regex validation from schema (handled in pre-save)
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address'] 
  },

  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  name: { type: String, trim: true },
  
  // Can be a Cloudinary URL or local path like /uploads/profile.jpg
  profilePicture: {
    type: String,
    trim: true,
    validate: {
      validator: val =>
        !val || /^https?:\/\/.+/.test(val) || /^\/?uploads\/.+/.test(val),
      message: 'Invalid profile picture path or URL'
    }
  },

  bio: { type: String, trim: true },
  jobTitle: { type: String, trim: true },
  company: { type: String, trim: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: Date,
  // Connections and relationship data
  pendingRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  connections: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  connectionRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  blockedUsers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] }
  
}, {
  timestamps: true,
  versionKey: false,
  strictPopulate: false
});


// Pre-save hook for password hashing and validation
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const password = this.password;

    // Improved regex to match your error message:
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!regex.test(password)) {
      return next(new Error('Password must contain at least 1 uppercase letter, 1 number, and 1 special character'));
    }

    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(password, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});


// Static method to verify credentials and generate token
userSchema.statics.matchPasswordandGenerateToken = async function (identifier, password) {
  const user = await this.findOne({ $or: [{ username: identifier }, { email: identifier }] });
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Password does not match');
  }

  return createTokenuser(user);
};

const User = mongoose.models.user || model("user", userSchema);
module.exports = User;
