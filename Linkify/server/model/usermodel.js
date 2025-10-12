// const { Schema, model } = require("mongoose");
// const bcrypt = require("bcryptjs");
// const { createTokenuser } = require('../service/authentication1');
// const mongoose = require("mongoose");

// const userSchema = new Schema({
//   username: { 
//     type: String, 
//     required: true, 
//     trim: true 
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 8
//     // Removed direct regex validation from schema (handled in pre-save)
//   },
//   email: { 
//     type: String, 
//     required: true, 
//     unique: true, 
//     match: [/\S+@\S+\.\S+/, 'Please use a valid email address'] 
//   },

//   resetPasswordToken: { type: String },
//   resetPasswordExpires: { type: Date },

//   name: { type: String, trim: true },
  
//   // Can be a Cloudinary URL or local path like /uploads/profile.jpg
//   profilePicture: {
//     type: String,
//     trim: true,
//     validate: {
//       validator: val =>
//         !val || /^https?:\/\/.+/.test(val) || /^\/?uploads\/.+/.test(val),
//       message: 'Invalid profile picture path or URL'
//     }
//   },

//   bio: { type: String, trim: true },
//   jobTitle: { type: String, trim: true },
//   company: { type: String, trim: true },
//   isOnline: { type: Boolean, default: false },
//   lastSeen: Date,
//   // Connections and relationship data
//   pendingRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
//   connections: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
//   connectionRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
//   blockedUsers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] }
  
// }, {
//   timestamps: true,
//   versionKey: false,
//   strictPopulate: false
// });


// // Pre-save hook for password hashing and validation
// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     const password = this.password;

//     // Improved regex to match your error message:
//     const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
//     if (!regex.test(password)) {
//       return next(new Error('Password must contain at least 1 uppercase letter, 1 number, and 1 special character'));
//     }

//     try {
//       const salt = await bcrypt.genSalt(10);
//       this.password = await bcrypt.hash(password, salt);
//       next();
//     } catch (err) {
//       next(err);
//     }
//   } else {
//     next();
//   }
// });


// // Static method to verify credentials and generate token
// userSchema.statics.matchPasswordandGenerateToken = async function (identifier, password) {
//   const user = await this.findOne({ $or: [{ username: identifier }, { email: identifier }] });
//   if (!user) {
//     throw new Error('User not found');
//   }

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     throw new Error('Password does not match');
//   }

//   return createTokenuser(user);
// };

// const User = mongoose.models.user || model("user", userSchema);
// module.exports = User;
const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const { createTokenuser } = require('../service/authentication1');
const mongoose = require("mongoose");
const crypto = require('crypto');
const userSchema = new Schema({
  username: { 
    type: String, 
    required: function() {
      return !this.googleId;
    }, 
    trim: true,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: 8
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    lowercase: true,
    trim: true
  },

  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  name: { 
    type: String, 
    trim: true,
    set: function(name) {
      // Capitalize first letter of each word when setting name
      if (name) {
        return name.replace(/\w\S*/g, function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      }
      return name;
    }
  },
  
  profilePicture: {
    type: String,
    trim: true,
    default: '/uploads/default-avatar.png',
    validate: {
      validator: function(val) {
        return !val || /^https?:\/\/.+/.test(val) || /^\/?uploads\/.+/.test(val);
      },
      message: 'Invalid profile picture path or URL'
    }
  },

  bio: { 
    type: String, 
    trim: true,
    maxlength: 500 
  },
  jobTitle: { 
    type: String, 
    trim: true,
    maxlength: 100 
  },
  company: { 
    type: String, 
    trim: true,
    maxlength: 100 
  },
  isOnline: { 
    type: Boolean, 
    default: false 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  
  profileCompleted: {
    type: Boolean,
    default: false
  },

  // Connections and relationship data
  pendingRequests: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  connections: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  connectionRequests: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  blockedUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Additional profile fields
  industry: { 
    type: String, 
    trim: true,
    maxlength: 100 
  },
  skills: [{ 
    type: String, 
    trim: true 
  }],
  location: { 
    type: String, 
    trim: true,
    maxlength: 100 
  },
  website: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(v);
      },
      message: 'Invalid website URL'
    }
  }

}, {
  timestamps: true,
  versionKey: false,
  strictPopulate: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive information when converting to JSON
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

// Virtual for checking if user has password (for Google OAuth users)
userSchema.virtual('hasPassword').get(function() {
  return !!this.password;
});

// Virtual for connection count
userSchema.virtual('connectionCount').get(function() {
  return this.connections ? this.connections.length : 0;
});

// Virtual for full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this.username || this._id}`;
});

// Pre-save hook for password hashing and validation
userSchema.pre('save', async function (next) {
  // Only validate and hash password if it's modified and user is not a Google OAuth user
  if (this.isModified('password') && this.password && !this.googleId) {
    const password = this.password;

    // Improved regex to match your error message:
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!regex.test(password)) {
      return next(new Error('Password must contain at least 1 uppercase letter, 1 number, and 1 special character'));
    }

    try {
      const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
      this.password = await bcrypt.hash(password, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else if (this.isModified('password') && this.googleId && !this.password) {
    // Google OAuth users don't need password validation
    next();
  } else {
    next();
  }
});

// Pre-save hook to set profile completion status
userSchema.pre('save', function(next) {
  // Check if profile is completed (has name, bio, jobTitle, company, profilePicture)
  const requiredFields = ['name', 'bio', 'jobTitle', 'company', 'profilePicture'];
  this.profileCompleted = requiredFields.every(field => {
    const value = this[field];
    return value && value.toString().trim().length > 0;
  });
  next();
});

// Pre-save hook to update lastSeen when isOnline changes to false
userSchema.pre('save', function(next) {
  if (this.isModified('isOnline') && !this.isOnline) {
    this.lastSeen = new Date();
  }
  next();
});

// Static method to verify credentials and generate token
userSchema.statics.matchPasswordandGenerateToken = async function (identifier, password) {
  const user = await this.findOne({ 
    $or: [{ username: identifier }, { email: identifier }] 
  }).select('+password'); // Explicitly select password field
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if this is a Google OAuth account without password
  if (user.googleId && !user.password) {
    throw new Error('This account uses Google authentication. Please sign in with Google.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastSeen = new Date();
  await user.save();

  return createTokenuser(user);
};

// Static method to find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function(profile) {
  try {
    // Check if user exists with googleId
    let user = await this.findOne({ googleId: profile.id });
    
    if (user) {
      user.lastSeen = new Date();
      user.isOnline = true;
      await user.save();
      return user;
    }
    
    // Check if user exists with same email
    user = await this.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.isVerified = true;
      user.profilePicture = profile.photos?.[0]?.value || user.profilePicture;
      user.lastSeen = new Date();
      user.isOnline = true;
      await user.save();
      return user;
    }
    
    // Create new user with Google data
    const baseUsername = profile.displayName.replace(/\s+/g, '').toLowerCase();
    let username = baseUsername;
    let counter = 1;
    
    // Ensure unique username
    while (await this.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    user = await this.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      username: username,
      name: profile.displayName,
      profilePicture: profile.photos?.[0]?.value,
      isVerified: true,
      isOnline: true,
      // Generate a random password for Google users
      password: await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now().toString(36), 12),
    });
    
    return user;
  } catch (error) {
    console.error('Google user creation error:', error);
    throw new Error(`Google authentication failed: ${error.message}`);
  }
};

// Method to check if user can reset password
userSchema.methods.canResetPassword = function() {
  return !this.googleId || (this.googleId && this.password);
};

// Method to validate password (for password changes)
userSchema.methods.validatePassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Method to get public profile (exclude sensitive data)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.googleId;
  
  return userObject;
};

// Method to get minimal user info (for connections lists)
userSchema.methods.toMinimalJSON = function() {
  return {
    _id: this._id,
    username: this.username,
    name: this.name,
    profilePicture: this.profilePicture,
    jobTitle: this.jobTitle,
    company: this.company,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen
  };
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ 'connections': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'skills': 1 });
userSchema.index({ industry: 1 });

const User = mongoose.models.user || model("user", userSchema);
module.exports = User;
