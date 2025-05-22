const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    userProfilePic: {
        type: String,  // Keep user profile pic if needed
        required: false, // Set to false if optional
    },
    name: {
        type: String,
        required: true,
    },
    media: {
        type: [String],  // Supports multiple media files
        default: [],
    },
    text: {
        type: String,
        required: false,
    },
    selectedFilter: {
        type: String,
        required: false,
    },
    selectedMusic: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Statusedit', statusSchema);
