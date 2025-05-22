const mongoose = require('mongoose');
const ProfileViewSchema = new mongoose.Schema({
    profileId: { type: String, required: true }, // ID of the profile being viewed
    viewerId: { type: String, required: true },  // ID of the viewer
    timestamp: { type: Date, default: Date.now },
  });
  
  const   ProfileView = mongoose.model('ProfileView', ProfileViewSchema);
  
  module.exports = ProfileView;
  